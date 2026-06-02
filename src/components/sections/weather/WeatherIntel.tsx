'use client';

import type { ProductionLocation } from '@/types/schedule';
import { format, addMinutes, subMinutes } from 'date-fns';
import { Cloud, Sunrise, Sunset, Umbrella, Wind } from 'lucide-react';
import { useEffect, useState } from 'react';

export type WeatherDaily = {
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
  windspeed_10m_max?: number[];
  sunrise?: string[];
  sunset?: string[];
};

type WeatherResult = {
  daily: WeatherDaily;
  resolvedName: string;
};

export type WeatherTarget = {
  latitude: number;
  longitude: number;
  label: string;
};

export type WeatherLocationCandidate = WeatherTarget & {
  query: string;
  provider?: 'kakao' | 'open-meteo' | 'osm' | 'local';
  address?: string;
  roadAddress?: string;
  category?: string;
  kakaoMapUrl?: string;
  naverMapUrl?: string;
};

const getWindSpeed = (daily: WeatherDaily) =>
  daily.wind_speed_10m_max?.[0] ?? daily.windspeed_10m_max?.[0] ?? 0;

const weatherNumber = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;

const localWeatherTargets: { patterns: RegExp[]; target: WeatherTarget }[] = [
  { patterns: [/gangnam/i, /강남구?/, /강남역/], target: { latitude: 37.4979, longitude: 127.0276, label: 'Gangnam-gu, Seoul' } },
  { patterns: [/mapo/i, /마포구?/], target: { latitude: 37.5663, longitude: 126.9019, label: 'Mapo-gu, Seoul' } },
  { patterns: [/yeongdeungpo/i, /영등포구?/, /한강/], target: { latitude: 37.5263, longitude: 126.8963, label: 'Yeongdeungpo-gu, Seoul' } },
  { patterns: [/seoul/i, /서울/], target: { latitude: 37.5665, longitude: 126.9780, label: 'Seoul, KR' } },
];

export const resolveLocalWeatherTarget = (query: string) =>
  localWeatherTargets.find((item) => item.patterns.some((pattern) => pattern.test(query)))?.target;

export const isGenericSeoulQuery = (query?: string) =>
  /^(seoul|서울|서울시|서울특별시)$/i.test((query || '').trim());

export const getLocationWeatherQuery = (locationItem: ProductionLocation) => {
  if (locationItem.weatherQuery && !isGenericSeoulQuery(locationItem.weatherQuery)) return locationItem.weatherQuery;
  return [locationItem.address, locationItem.name, locationItem.weatherQuery].filter(Boolean).join(' ');
};

export const getProductionLocationWeatherTarget = (locationItem: ProductionLocation): WeatherTarget | undefined => {
  if (typeof locationItem.weatherLatitude !== 'number' || typeof locationItem.weatherLongitude !== 'number') return undefined;
  return {
    latitude: locationItem.weatherLatitude,
    longitude: locationItem.weatherLongitude,
    label: locationItem.weatherLabel || locationItem.weatherQuery || locationItem.name,
  };
};

const normalizedLocationToken = (value?: string) => (value || '').trim().toLowerCase();

export const getPreferredWeatherLocationValue = (locationItem: Partial<ProductionLocation>) =>
  [
    locationItem.weatherQuery,
    locationItem.weatherLabel,
    locationItem.address,
    locationItem.name,
  ].find((value) => value?.trim())?.trim() || '';

export const matchesWeatherLocationSelection = (currentLocation: string, locationItem?: Partial<ProductionLocation> | null) => {
  if (!locationItem) return false;
  const current = normalizedLocationToken(currentLocation);
  if (!current) return false;

  return [
    locationItem.weatherQuery,
    locationItem.weatherLabel,
    locationItem.address,
    locationItem.name,
  ].some((value) => normalizedLocationToken(value) === current);
};

export const searchWeatherLocationCandidates = async (query: string): Promise<WeatherLocationCandidate[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const local = resolveLocalWeatherTarget(trimmed);
  const localCandidates: WeatherLocationCandidate[] = local ? [{ ...local, query: trimmed, provider: 'local' }] : [];

  const kakaoSearch = fetch(`/api/places/kakao?query=${encodeURIComponent(trimmed)}`)
    .then(async (response) => {
      if (!response.ok) return [];
      const data = await response.json();
      return (data.candidates || []) as WeatherLocationCandidate[];
    })
    .catch(() => [] as WeatherLocationCandidate[]);

  const openMeteoSearch = fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=ko&format=json`)
    .then(async (response) => {
      if (!response.ok) return [];
      const data = await response.json();
      return (data.results || []).map((geo: { latitude: number; longitude: number; name: string; admin1?: string; country_code?: string }) => ({
        latitude: geo.latitude,
        longitude: geo.longitude,
        label: [geo.name, geo.admin1, geo.country_code].filter(Boolean).join(', '),
        query: trimmed,
        provider: 'open-meteo' as const,
      }));
    })
    .catch(() => [] as WeatherLocationCandidate[]);

  const nominatimSearch = fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=ko&q=${encodeURIComponent(trimmed)}`)
    .then(async (response) => {
      if (!response.ok) return [];
      const data = await response.json();
      return (data || []).map((place: { lat: string; lon: string; display_name: string; name?: string }) => ({
        latitude: Number(place.lat),
        longitude: Number(place.lon),
        label: place.display_name || place.name || trimmed,
        query: trimmed,
        provider: 'osm' as const,
      })).filter((candidate: WeatherLocationCandidate) => Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude));
    })
    .catch(() => [] as WeatherLocationCandidate[]);

  const [kakaoCandidates, openMeteoCandidates, nominatimCandidates] = await Promise.all([kakaoSearch, openMeteoSearch, nominatimSearch]);

  const seen = new Set<string>();
  return [...kakaoCandidates, ...localCandidates, ...openMeteoCandidates, ...nominatimCandidates].filter((candidate) => {
    const key = `${candidate.latitude.toFixed(3)}:${candidate.longitude.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fetchWeatherDaily = async (location: string, date: string, fixedTarget?: WeatherTarget): Promise<WeatherResult> => {
  const query = location.trim();
  if (!query && !fixedTarget) throw new Error('날씨 조회 위치가 비어 있습니다.');

  let target = fixedTarget || resolveLocalWeatherTarget(query);

  if (!target) {
    const [candidate] = await searchWeatherLocationCandidates(query);
    if (!candidate) throw new Error('위치를 찾지 못했습니다.');
    target = candidate;
  }

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${target.latitude}&longitude=${target.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max&timezone=auto&start_date=${date}&end_date=${date}`,
  );
  if (!weatherRes.ok) throw new Error('날씨 데이터를 불러오지 못했습니다.');

  const weatherData = await weatherRes.json();
  if (!weatherData.daily?.sunrise?.[0]) throw new Error('해당 날짜의 날씨 데이터가 없습니다.');

  return {
    daily: weatherData.daily,
    resolvedName: target.label,
  };
};

const useWeatherDaily = (location: string, date: string, target?: WeatherTarget) => {
  const [data, setData] = useState<WeatherDaily | null>(null);
  const [resolvedName, setResolvedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const targetLatitude = target?.latitude;
  const targetLongitude = target?.longitude;
  const targetLabel = target?.label;

  useEffect(() => {
    let ignore = false;
    const fixedTarget = typeof targetLatitude === 'number' && typeof targetLongitude === 'number'
      ? { latitude: targetLatitude, longitude: targetLongitude, label: targetLabel || location }
      : undefined;

    const fetchWeather = async () => {
      if (!location.trim() && !fixedTarget) {
        setData(null);
        setResolvedName('');
        setError('');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const result = await fetchWeatherDaily(location, date, fixedTarget);
        if (ignore) return;
        setData(result.daily);
        setResolvedName(result.resolvedName);
      } catch (e) {
        if (ignore) return;
        console.error(e);
        setData(null);
        setResolvedName('');
        setError(e instanceof Error ? e.message : '날씨 데이터를 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    const timer = setTimeout(fetchWeather, 800);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [location, date, targetLatitude, targetLongitude, targetLabel]);

  return { data, resolvedName, loading, error };
};

export const WeatherWidget = ({ location, date, target }: { location: string, date: string, target?: WeatherTarget }) => {
  const { data, loading, error } = useWeatherDaily(location, date, target);

  if (loading) return <div className="bg-neutral-900 h-24 rounded-2xl border border-neutral-800 animate-pulse flex items-center justify-center text-neutral-600 text-sm italic">날씨 정보 불러오는 중...</div>;
  if (error) return <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm font-bold text-red-300">{error}</div>;
  const sunriseAt = data?.sunrise?.[0];
  const sunsetAt = data?.sunset?.[0];
  if (!data || !sunriseAt || !sunsetAt) return null;

  const maxTemp = weatherNumber(data.temperature_2m_max?.[0]);
  const minTemp = weatherNumber(data.temperature_2m_min?.[0]);
  const precipitation = weatherNumber(data.precipitation_probability_max?.[0]);
  const windSpeed = weatherNumber(getWindSpeed(data));

  return (
    <div className="bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800/60 backdrop-blur-sm flex flex-wrap gap-6 items-center justify-between">
      <div className="flex flex-wrap gap-8 items-center">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400 border border-indigo-500/20">
             <Cloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-0.5">Weather Intel</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-neutral-200">{maxTemp ?? '-'}°C</span>
              <span className="text-neutral-600">/</span>
              <span className="text-sm text-neutral-400">{minTemp ?? '-'}°C</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-neutral-950/50 px-3 py-1.5 rounded-lg border border-neutral-800">
            <Umbrella className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-[10px] text-neutral-500 font-bold leading-none mb-1">강수 확률</p>
              <p className="text-sm font-bold text-neutral-200 leading-none">{precipitation ?? '-'}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-neutral-950/50 px-3 py-1.5 rounded-lg border border-neutral-800">
            <Wind className="w-4 h-4 text-teal-400" />
            <div>
              <p className="text-[10px] text-neutral-500 font-bold leading-none mb-1">최대 풍속</p>
              <p className="text-sm font-bold text-neutral-200 leading-none">{windSpeed ?? '-'}km/h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-10">
        <div className="flex items-center gap-3">
          <Sunrise className="w-5 h-5 text-amber-500/80" />
          <div>
            <p className="text-[9px] uppercase text-neutral-500 font-bold">Sunrise</p>
            <p className="text-sm font-mono font-bold text-neutral-300">{format(new Date(sunriseAt), 'HH:mm')}</p>
            <p className="text-[10px] text-blue-400 mt-1">블루: {format(subMinutes(new Date(sunriseAt), 30), 'HH:mm')}~</p>
            <p className="text-[10px] text-amber-400">골든: {format(new Date(sunriseAt), 'HH:mm')}~{format(addMinutes(new Date(sunriseAt), 60), 'HH:mm')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Sunset className="w-5 h-5 text-indigo-400/80" />
          <div>
            <p className="text-[9px] uppercase text-neutral-500 font-bold">Sunset</p>
            <p className="text-sm font-mono font-bold text-neutral-300">{format(new Date(sunsetAt), 'HH:mm')}</p>
            <p className="text-[10px] text-amber-400 mt-1">골든: {format(subMinutes(new Date(sunsetAt), 60), 'HH:mm')}~</p>
            <p className="text-[10px] text-blue-400">블루: {format(new Date(sunsetAt), 'HH:mm')}~{format(addMinutes(new Date(sunsetAt), 30), 'HH:mm')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export const LocationWeatherSummary = ({ query, date, target }: { query: string; date: string; target?: WeatherTarget }) => {
  const { data, resolvedName, loading, error } = useWeatherDaily(query, date, target);
  const maxTemp = weatherNumber(data?.temperature_2m_max?.[0]);
  const minTemp = weatherNumber(data?.temperature_2m_min?.[0]);
  const precipitation = weatherNumber(data?.precipitation_probability_max?.[0]);

  if (!query.trim() && !target) {
    return (
      <div className="mt-1 text-xs font-bold text-neutral-600">
        조회 위치 없음
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-1 h-4 w-24 animate-pulse rounded bg-neutral-800" />
    );
  }

  if (error || !data) {
    return (
      <div className="mt-1 truncate text-xs font-bold text-red-400" title={error || query}>
        조회 실패 · {query}
      </div>
    );
  }

  return (
    <div className="mt-1 min-w-0">
      <div className="flex items-center gap-2 font-bold text-neutral-200">
        <Cloud className="h-3.5 w-3.5 text-indigo-300" />
        <span>{maxTemp ?? '-'}° / {minTemp ?? '-'}°</span>
        <span className="text-neutral-600">·</span>
        <Umbrella className="h-3.5 w-3.5 text-blue-400" />
        <span>{precipitation ?? '-'}%</span>
      </div>
      <div className="mt-1 truncate text-[10px] font-bold text-neutral-600" title={resolvedName || query}>
        {resolvedName || query}
      </div>
    </div>
  );
};
