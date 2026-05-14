export default function ProductionGuideFooter() {
  return (
    <>
      <details className="group mt-12 border-t border-neutral-900 pb-20 pt-6 text-neutral-400">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-neutral-900 bg-neutral-950/70 px-5 py-4 transition-all hover:border-neutral-800">
          <span className="text-sm font-black text-neutral-300">도움말 / 제작 가이드</span>
          <span className="text-neutral-600 transition-transform group-open:rotate-180">↓</span>
        </summary>
        <div className="grid grid-cols-1 gap-8 pt-8 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-200">
              <span className="h-6 w-1 rounded-full bg-indigo-500" />
              효율적인 촬영 준비를 위한 가이드
            </h3>
            <div className="space-y-5">
              <div>
                <h4 className="mb-1 font-medium text-neutral-300">1. 일촬표(Call Sheet)의 중요성</h4>
                <p className="text-sm leading-relaxed">촬영 현장의 모든 스태프가 공유하는 단 하나의 지도입니다. 시작 시간, 장소, 촬영 순서를 명확히 기재하여 불필요한 대기 시간을 줄이는 것이 핵심입니다.</p>
              </div>
              <div>
                <h4 className="mb-1 font-medium text-neutral-300">2. 씬(Scene) 배치 전략</h4>
                <p className="text-sm leading-relaxed">보통 조명 세팅의 효율을 위해 같은 장소와 같은 시간대(Day/Night)를 묶어서 촬영하는 것이 제작비를 아끼는 지름길입니다.</p>
              </div>
              <div>
                <h4 className="mb-1 font-medium text-neutral-300">3. AI 콘티 활용법</h4>
                <p className="text-sm leading-relaxed">PrePro Studio의 AI 콘티는 감독의 머릿속에 있는 앵글을 빠르게 시각화해줍니다. 필요한 순간에만 콘티 갤러리를 열어 선택하세요.</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800/50 bg-neutral-900/50 p-6">
            <h3 className="mb-4 text-lg font-semibold text-neutral-200">자주 묻는 질문 (FAQ)</h3>
            <div className="space-y-4 text-sm">
              <details className="group/faq cursor-pointer">
                <summary className="flex list-none items-center justify-between font-medium text-neutral-300">
                  데이터는 어디에 저장되나요? <span className="transition-transform group-open/faq:rotate-180">↓</span>
                </summary>
                <p className="mt-2 text-neutral-500">현재 모든 데이터는 보안을 위해 브라우저의 로컬 스토리지에만 저장됩니다. 별도의 회원가입 없이도 안심하고 사용하세요.</p>
              </details>
              <details className="group/faq cursor-pointer">
                <summary className="flex list-none items-center justify-between font-medium text-neutral-300">
                  PDF가 잘려서 나와요. <span className="transition-transform group-open/faq:rotate-180">↓</span>
                </summary>
                <p className="mt-2 text-neutral-500">일촬표 특성상 가로형 레이아웃에 최적화되어 있습니다. 내보내기 시 자동으로 A4 가로 사이즈로 조정됩니다.</p>
              </details>
            </div>
          </div>
        </div>
      </details>

      <footer className="mt-12 border-t border-neutral-900 pt-6 text-xs font-bold text-neutral-700">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span>PrePro Studio © 2026. All rights reserved.</span>
          <span>Unauthorized copying, redistribution, or commercial reuse is prohibited.</span>
        </div>
      </footer>
    </>
  );
}
