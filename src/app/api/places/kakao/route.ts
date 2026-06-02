import { NextResponse } from 'next/server';

type KakaoPlaceDocument = {
  id?: string;
  place_name?: string;
  address_name?: string;
  road_address_name?: string;
  x?: string;
  y?: string;
  place_url?: string;
  category_name?: string;
};

type KakaoAddressDocument = {
  address_name?: string;
  x?: string;
  y?: string;
  address?: {
    address_name?: string;
  };
  road_address?: {
    address_name?: string;
  };
};

type PlaceCandidate = {
  provider: 'kakao';
  id: string;
  label: string;
  query: string;
  latitude: number;
  longitude: number;
  address?: string;
  roadAddress?: string;
  category?: string;
  kakaoMapUrl?: string;
  naverMapUrl: string;
};

const noStoreHeaders = {
  'Cache-Control': 'no-store, max-age=0',
};

const buildNaverMapUrl = (candidate: { label: string; address?: string; latitude: number; longitude: number }) => {
  const query = encodeURIComponent([candidate.label, candidate.address].filter(Boolean).join(' '));
  return `https://map.naver.com/p/search/${query}`;
};

const toNumber = (value?: string) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
};

const normalizeKeywordDocument = (doc: KakaoPlaceDocument, query: string): PlaceCandidate | null => {
  const latitude = toNumber(doc.y);
  const longitude = toNumber(doc.x);
  const label = doc.place_name?.trim() || doc.road_address_name?.trim() || doc.address_name?.trim();
  if (latitude === null || longitude === null || !label) return null;

  const address = doc.road_address_name?.trim() || doc.address_name?.trim() || undefined;
  return {
    provider: 'kakao',
    id: doc.id || `${latitude}:${longitude}:${label}`,
    label,
    query,
    latitude,
    longitude,
    address,
    roadAddress: doc.road_address_name?.trim() || undefined,
    category: doc.category_name?.trim() || undefined,
    kakaoMapUrl: doc.place_url?.trim() || `https://map.kakao.com/link/search/${encodeURIComponent(label)}`,
    naverMapUrl: buildNaverMapUrl({ label, address, latitude, longitude }),
  };
};

const normalizeAddressDocument = (doc: KakaoAddressDocument, query: string): PlaceCandidate | null => {
  const latitude = toNumber(doc.y);
  const longitude = toNumber(doc.x);
  const roadAddress = doc.road_address?.address_name?.trim();
  const address = roadAddress || doc.address?.address_name?.trim() || doc.address_name?.trim();
  if (latitude === null || longitude === null || !address) return null;

  return {
    provider: 'kakao',
    id: `${latitude}:${longitude}:${address}`,
    label: address,
    query,
    latitude,
    longitude,
    address,
    roadAddress,
    kakaoMapUrl: `https://map.kakao.com/link/search/${encodeURIComponent(address)}`,
    naverMapUrl: buildNaverMapUrl({ label: address, address, latitude, longitude }),
  };
};

const fetchKakao = async <T>(path: string, query: string, apiKey: string): Promise<T[]> => {
  const url = new URL(`https://dapi.kakao.com/v2/local/${path}`);
  url.searchParams.set('query', query);
  url.searchParams.set('size', '5');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = typeof payload?.message === 'string' ? payload.message : `Kakao Local API error (${response.status})`;
    throw new Error(message);
  }

  const payload = await response.json() as { documents?: T[] };
  return payload.documents || [];
};

export async function GET(request: Request) {
  try {
    const apiKey = process.env.KAKAO_REST_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'KAKAO_REST_API_KEY 환경변수가 필요합니다.' },
        { status: 503, headers: noStoreHeaders },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();
    if (!query) {
      return NextResponse.json({ candidates: [] }, { headers: noStoreHeaders });
    }

    const [keywordDocs, addressDocs] = await Promise.all([
      fetchKakao<KakaoPlaceDocument>('search/keyword.json', query, apiKey),
      fetchKakao<KakaoAddressDocument>('search/address.json', query, apiKey),
    ]);

    const seen = new Set<string>();
    const candidates = [
      ...keywordDocs.map((doc) => normalizeKeywordDocument(doc, query)),
      ...addressDocs.map((doc) => normalizeAddressDocument(doc, query)),
    ].filter((candidate): candidate is PlaceCandidate => {
      if (!candidate) return false;
      const key = `${candidate.latitude.toFixed(5)}:${candidate.longitude.toFixed(5)}:${candidate.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);

    return NextResponse.json({ candidates }, { headers: noStoreHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '카카오 장소 검색에 실패했습니다.' },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
