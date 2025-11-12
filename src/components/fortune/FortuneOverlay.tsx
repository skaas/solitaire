import { useEffect, useState } from 'react';
import type { FortuneReport } from '../../types';
import { createFortuneSummaryMessages } from '../../services/fortuneSummaryPrompt';
import { requestFortuneSummary } from '../../services/llmClient';

interface FortuneOverlayProps {
  score: number;
  report: FortuneReport;
  onRestart: () => void;
}

const tierColorMap: Record<number, string> = {
  1: 'bg-white/10',
  2: 'bg-pink-500/20',
  3: 'bg-yellow-500/30',
};

const FortuneOverlay = ({ score, report, onRestart }: FortuneOverlayProps) => {
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      try {
        setIsLoadingSummary(true);
        setSummary(null);
        setSummaryError(null);

        const { system, user } = createFortuneSummaryMessages({
          report,
          score,
        });

        const result = await requestFortuneSummary(
          [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          { signal: controller.signal },
        );

        if (!controller.signal.aborted) {
          setSummary(result);
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        if (!controller.signal.aborted) {
          setSummaryError(
            error instanceof Error
              ? error.message
              : '요약 생성 중 알 수 없는 문제가 발생했습니다.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSummary(false);
        }
      }
    }

    run();

    return () => {
      controller.abort();
    };
  }, [report.timestamp, score, requestKey]);

  const handleRetry = () => {
    setRequestKey((prev) => prev + 1);
  };

  // LLM summary에서 제목과 본문 분리
  const parseSummary = (text: string | null) => {
    if (!text) return { title: null, body: null };
    
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { title: null, body: null };
    
    const title = lines[0].trim();
    const body = lines.slice(1).join('\n').trim();
    
    return { title, body };
  };

  const { title: summaryTitle, body: summaryBody } = parseSummary(summary);

  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#3A166A] px-6 py-8 rounded-2xl text-white shadow-2xl border border-purple-400/30">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-yellow-200">오늘의 운세</h2>
            <p className="text-xs text-white/60">{new Date(report.timestamp).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/70">최종 점수</p>
            <p className="text-2xl font-extrabold text-yellow-300">{score.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-purple-900/60 border border-purple-500/50 rounded-xl p-4 mb-6">
          <p className="text-lg font-semibold text-yellow-200 mb-1">{report.summaryLabel}</p>
          {isLoadingSummary && (
            <p className="text-sm text-white/80 leading-relaxed">운세를 해석하는 중...</p>
          )}
          {!isLoadingSummary && summaryTitle && (
            <p className="text-sm text-white/80 leading-relaxed">{summaryTitle}</p>
          )}
          {!isLoadingSummary && !summaryTitle && (
            <p className="text-sm text-white/80 leading-relaxed">{report.summaryDetail}</p>
          )}
        </div>

        <section className="mb-6">
          <h3 className="text-sm font-semibold text-white/80 mb-2">오늘의 운세</h3>
          <div className="bg-purple-900/40 p-4 rounded-xl border border-purple-500/30 text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
            {isLoadingSummary && <p>당신의 오늘의 운세를 점치는 중입니다...</p>}
            {!isLoadingSummary && summaryError && (
              <div className="space-y-2">
                <p className="text-red-200">요약 생성에 실패했습니다: {summaryError}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1 rounded-md bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/20"
                >
                  다시 시도
                </button>
              </div>
            )}
            {!isLoadingSummary && !summaryError && summaryBody && <p>{summaryBody}</p>}
            {!isLoadingSummary && !summaryError && !summaryBody && (
              <p className="text-white/60">요약 결과가 없습니다.</p>
            )}
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-semibold text-white/80 mb-2">핵심 카드 흐름</h3>
          <div className="grid grid-cols-3 gap-4">
            {report.topCards.map((card) => (
              <div
                key={card.id}
                className={`rounded-2xl px-4 py-6 shadow-lg flex flex-col items-center justify-center border border-white/10 ${tierColorMap[card.tier]}`}
              >
                <span className="text-5xl mb-3">{card.suitEmoji}</span>
                <p className="text-3xl font-bold text-white mb-2">{card.value}</p>
                <p className="text-sm text-white/70 font-medium">{card.suitLabel}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-purple-900/40 p-4 rounded-xl border border-purple-500/30">
            <h3 className="text-sm font-semibold text-white/80 mb-3">등급 분포</h3>
            <ul className="space-y-2 text-sm font-medium">
              <li className="flex justify-between"><span>대운 (3단계)</span><span>{report.tierCounts[3]}장</span></li>
              <li className="flex justify-between"><span>상징 (2단계)</span><span>{report.tierCounts[2]}장</span></li>
              <li className="flex justify-between"><span>일상 (1단계)</span><span>{report.tierCounts[1]}장</span></li>
            </ul>
          </div>
          <div className="bg-purple-900/40 p-4 rounded-xl border border-purple-500/30">
            <h3 className="text-sm font-semibold text-white/80 mb-3">에너지 변동</h3>
            <p className="text-lg font-bold text-yellow-200 mb-1">{report.volatilityScore >= 0 ? `+${report.volatilityScore}` : report.volatilityScore}</p>
            <p className="text-sm text-white/70">{report.volatility === 'volatile' ? '변화의 파도가 크게 일렁입니다.' : report.volatility === 'mixed' ? '에너지가 다층적으로 교차합니다.' : '흐름이 안정적으로 이어집니다.'}</p>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-semibold text-white/80 mb-2">Dominant Flow</h3>
          <div className="space-y-2">
            {report.dominantSuits.map((highlight) => (
              <div key={highlight.suitId} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{highlight.suitEmoji}</span>
                  <span className="font-semibold">{highlight.suitLabel}</span>
                </div>
                <span className="text-xs text-white/70">x {highlight.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-white/80">Narrative</h3>
          {report.narrativeLines.map((line, index) => (
            <p key={index} className="text-sm text-white/80 leading-relaxed bg-purple-900/30 border border-purple-500/30 rounded-lg px-4 py-3">
              {line}
            </p>
          ))}
        </section>

        <div className="flex justify-end">
          <button
            onClick={onRestart}
            className="bg-gradient-to-r from-yellow-500 to-pink-500 text-gray-900 font-bold px-6 py-2 rounded-lg shadow-lg hover:from-yellow-400 hover:to-pink-400 transition-colors"
          >
            운을 다시 시험하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FortuneOverlay;

