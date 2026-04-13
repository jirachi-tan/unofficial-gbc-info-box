import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { trackQuizStart, trackQuizAnswer, trackQuizComplete } from "../lib/gtag";
import {
    HelpCircle,
    Sparkles,
    RotateCcw,
    Trophy,
    Zap,
    CheckCircle2,
    XCircle,
    Home,
} from "lucide-react";

type QuizItem = { id: string; question: string; answer: string };

function cn(...classes: Array<string | false | undefined | null>) {
    return classes.filter(Boolean).join(" ");
}

function shuffleArray<T>(arr: T[]): T[] {
    const next = [...arr];
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
}

const QUIZ_COUNT = 10;

type Phase = "start" | "playing" | "result";
type SelfJudge = "correct" | "wrong" | null;

export default function QuizPage() {
    const [allQuizItems, setAllQuizItems] = useState<QuizItem[]>([]);
    const [loading, setLoading] = useState(true);

    // game state
    const [phase, setPhase] = useState<Phase>("start");
    const [questions, setQuestions] = useState<QuizItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [judgments, setJudgments] = useState<SelfJudge[]>([]);
    const [exitDirection, setExitDirection] = useState<"left" | "right">("left");

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const res = await fetch(
                    `${import.meta.env.BASE_URL}data/quiz.json?v=${__BUILD_TIMESTAMP__}`,
                    { cache: "no-store" }
                );
                if (!res.ok) throw new Error(`quiz.json: ${res.status}`);
                const data: unknown = await res.json();
                if (
                    Array.isArray(data) &&
                    data.every(
                        (d) =>
                            d &&
                            typeof d === "object" &&
                            typeof d.id === "string" &&
                            typeof d.question === "string" &&
                            typeof d.answer === "string"
                    )
                ) {
                    if (!cancelled) setAllQuizItems(data as QuizItem[]);
                }
            } catch (e) {
                console.error("Failed to load quiz.json", e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void load();
        return () => { cancelled = true; };
    }, []);

    const startGame = useCallback(() => {
        const picked = shuffleArray(allQuizItems).slice(0, QUIZ_COUNT);
        setQuestions(picked);
        setCurrentIndex(0);
        setFlipped(false);
        setJudgments([]);
        setPhase("playing");
        trackQuizStart();
    }, [allQuizItems]);

    const handleFlip = () => {
        if (!flipped) setFlipped(true);
    };

    const handleJudge = (judge: SelfJudge) => {
        const isCorrect = judge === "correct";
        if (currentQuiz) {
            trackQuizAnswer(currentQuiz.id, isCorrect);
        }
        const nextJudgments = [...judgments, judge];
        setJudgments((prev) => [...prev, judge]);
        if (currentIndex + 1 >= questions.length) {
            const finalCorrect = nextJudgments.filter((j) => j === "correct").length;
            const finalTotal = nextJudgments.length;
            const finalPercent = Math.round((finalCorrect / finalTotal) * 100);
            trackQuizComplete(finalCorrect, finalTotal, finalPercent);
            setExitDirection("left");
            setPhase("result");
        } else {
            setExitDirection("left");
            setFlipped(false);
            setCurrentIndex((i) => i + 1);
        }
    };

    const correctCount = useMemo(
        () => judgments.filter((j) => j === "correct").length,
        [judgments]
    );

    const wrongCount = useMemo(
        () => judgments.filter((j) => j === "wrong").length,
        [judgments]
    );

    const scorePercent = useMemo(
        () =>
            judgments.length > 0
                ? Math.round((correctCount / judgments.length) * 100)
                : 0,
        [correctCount, judgments.length]
    );

    const scoreMessage = useMemo(() => {
        if (scorePercent === 100) return "パーフェクト！すごい（ﾉ｡ᴖ.）！";
        if (scorePercent >= 80) return "素晴らしい！かなりの知識量（ﾉ｡ᴖ.）！";
        if (scorePercent >= 60) return "なかなかの実力（ﾉ｡ᴖ.）！";
        if (scorePercent >= 40) return "まだまだこれから（ﾉ｡ᴖ.）！";
        return "ドンマイ！もう一回挑戦しよう（ﾉ｡ᴖ.）！";
    }, [scorePercent]);

    const currentQuiz = questions[currentIndex] ?? null;

    // --- RENDER ---

    if (loading) {
        return (
            <div className="shell main-stack">
                <section className="panel">
                    <div className="quiz-loading">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        >
                            <Zap className="quiz-loading-icon" />
                        </motion.div>
                        <p>クイズデータを読み込み中...</p>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="shell main-stack">
            <AnimatePresence mode="wait">
                {/* ─── START SCREEN ─── */}
                {phase === "start" && (
                    <motion.div
                        key="start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <section className="panel quiz-start-panel">
                            <div className="quiz-start-bg">
                                <div className="quiz-start-orb quiz-start-orb-1" />
                                <div className="quiz-start-orb quiz-start-orb-2" />
                            </div>
                            <div className="quiz-start-content">
                                <motion.div
                                    className="quiz-start-icon-wrap"
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <HelpCircle className="quiz-start-icon" />
                                </motion.div>
                                <div className="eyebrow violet">quiz challenge</div>
                                <h2 className="panel-title" style={{ textAlign: "center" }}>
                                    クイズに挑戦！
                                </h2>
                                <p className="quiz-start-desc">
                                    ランダムに選ばれた <strong>{QUIZ_COUNT}問</strong> に挑戦！
                                    <br />
                                    カードをタップして答えを確認しよう。
                                </p>
                                <div className="quiz-start-stats">
                                    <div className="quiz-start-stat">
                                        <span className="quiz-start-stat-num">{allQuizItems.length}</span>
                                        <span className="quiz-start-stat-label">問題数</span>
                                    </div>
                                    <div className="quiz-start-stat-divider" />
                                    <div className="quiz-start-stat">
                                        <span className="quiz-start-stat-num">{QUIZ_COUNT}</span>
                                        <span className="quiz-start-stat-label">出題数</span>
                                    </div>
                                </div>
                                <motion.button
                                    className="quiz-btn quiz-btn-primary"
                                    onClick={startGame}
                                    disabled={allQuizItems.length === 0}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <Sparkles className="icon-16" />
                                    挑戦スタート！
                                </motion.button>
                                <p className="quiz-start-notice">
                                    本問題は管理者が以前スペース配信で使用するために自作した問題です。誤りがあったらごめんなさい！
                                    <br />
                                    問題の追加はあまり期待せずにお待ちください...！
                                </p>
                            </div>
                        </section>
                    </motion.div>
                )}

                {/* ─── PLAYING SCREEN ─── */}
                {phase === "playing" && currentQuiz && (
                    <motion.div
                        key="playing"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <section className="panel quiz-play-panel">
                            {/* progress bar */}
                            <div className="quiz-progress-wrap">
                                <div className="quiz-progress-header">
                                    <span className="quiz-progress-label">
                                        Q{currentIndex + 1}
                                        <span className="quiz-progress-total"> / {questions.length}</span>
                                    </span>
                                    <div className="quiz-score-inline">
                                        <span className="quiz-score-correct">
                                            <CheckCircle2 className="icon-14" /> {correctCount}
                                        </span>
                                        <span className="quiz-score-wrong">
                                            <XCircle className="icon-14" /> {wrongCount}
                                        </span>
                                    </div>
                                </div>
                                <div className="quiz-progress-bar">
                                    <motion.div
                                        className="quiz-progress-fill"
                                        initial={false}
                                        animate={{
                                            width: `${((currentIndex + 1) / questions.length) * 100}%`,
                                        }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                    />
                                </div>
                            </div>

                            {/* card area */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentQuiz.id}
                                    initial={{ opacity: 0, x: 60 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{
                                        opacity: 0,
                                        x: exitDirection === "left" ? -60 : 60,
                                    }}
                                    transition={{ duration: 0.32 }}
                                    className="quiz-card-stage"
                                >
                                    <div
                                        className={cn("quiz-card", flipped && "quiz-card-flipped")}
                                        onClick={handleFlip}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") handleFlip();
                                        }}
                                    >
                                        {/* front */}
                                        <div className="quiz-card-face quiz-card-front">
                                            <div className="quiz-card-badge">
                                                <HelpCircle className="icon-16" />
                                                Question
                                            </div>
                                            <p className="quiz-card-text">{currentQuiz.question}</p>
                                            {!flipped && (
                                                <motion.div
                                                    className="quiz-card-tap-hint"
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                >
                                                    タップで答えを見る
                                                </motion.div>
                                            )}
                                        </div>
                                        {/* back */}
                                        <div className="quiz-card-face quiz-card-back">
                                            <div className="quiz-card-badge quiz-card-badge-answer">
                                                <Sparkles className="icon-16" />
                                                Answer
                                            </div>
                                            <p className="quiz-card-answer-text">{currentQuiz.answer}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* judge & next buttons */}
                            <AnimatePresence>
                                {flipped && (
                                    <motion.div
                                        className="quiz-judge-area"
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 16 }}
                                        transition={{ duration: 0.22 }}
                                    >
                                        <p className="quiz-judge-prompt">正解できましたか？</p>
                                        <div className="quiz-judge-buttons">
                                            <motion.button
                                                className="quiz-btn quiz-btn-correct"
                                                onClick={() => handleJudge("correct")}
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.96 }}
                                            >
                                                <CheckCircle2 className="icon-18" />
                                                正解した！
                                            </motion.button>
                                            <motion.button
                                                className="quiz-btn quiz-btn-wrong"
                                                onClick={() => handleJudge("wrong")}
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.96 }}
                                            >
                                                <XCircle className="icon-18" />
                                                不正解...
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>
                    </motion.div>
                )}

                {/* ─── RESULT SCREEN ─── */}
                {phase === "result" && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.35 }}
                    >
                        <section className="panel quiz-result-panel">
                            <div className="quiz-result-bg">
                                <div className="quiz-result-orb quiz-result-orb-1" />
                                <div className="quiz-result-orb quiz-result-orb-2" />
                            </div>
                            <div className="quiz-result-content">
                                <motion.div
                                    className="quiz-result-trophy"
                                    initial={{ scale: 0, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 14 }}
                                >
                                    <Trophy className="quiz-result-trophy-icon" />
                                </motion.div>
                                <h2 className="quiz-result-title">チャレンジ完了！</h2>
                                <p className="quiz-result-message">{scoreMessage}</p>

                                <div className="quiz-result-score-ring">
                                    <svg viewBox="0 0 120 120" className="quiz-ring-svg">
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="52"
                                            fill="none"
                                            stroke="#e2e8f0"
                                            strokeWidth="8"
                                        />
                                        <motion.circle
                                            cx="60"
                                            cy="60"
                                            r="52"
                                            fill="none"
                                            stroke="url(#quiz-gradient)"
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 52}`}
                                            initial={{
                                                strokeDashoffset: 2 * Math.PI * 52,
                                            }}
                                            animate={{
                                                strokeDashoffset:
                                                    2 * Math.PI * 52 * (1 - scorePercent / 100),
                                            }}
                                            transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                                            transform="rotate(-90 60 60)"
                                        />
                                        <defs>
                                            <linearGradient id="quiz-gradient" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#ec4899" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="quiz-ring-label">
                                        <motion.span
                                            className="quiz-ring-number"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            {scorePercent}
                                        </motion.span>
                                        <span className="quiz-ring-unit">%</span>
                                    </div>
                                </div>

                                <div className="quiz-result-breakdown">
                                    <div className="quiz-result-stat quiz-result-stat-correct">
                                        <CheckCircle2 className="icon-18" />
                                        <span>{correctCount} 正解</span>
                                    </div>
                                    <div className="quiz-result-stat quiz-result-stat-wrong">
                                        <XCircle className="icon-18" />
                                        <span>{wrongCount} 不正解</span>
                                    </div>
                                </div>

                                {/* Review list */}
                                <div className="quiz-review-list">
                                    {questions.map((q, i) => (
                                        <div
                                            key={q.id}
                                            className={cn(
                                                "quiz-review-item",
                                                judgments[i] === "correct" && "quiz-review-correct",
                                                judgments[i] === "wrong" && "quiz-review-wrong"
                                            )}
                                        >
                                            <div className="quiz-review-head">
                                                <span className="quiz-review-num">Q{i + 1}</span>
                                                {judgments[i] === "correct" ? (
                                                    <CheckCircle2 className="icon-16 quiz-review-icon-ok" />
                                                ) : (
                                                    <XCircle className="icon-16 quiz-review-icon-ng" />
                                                )}
                                            </div>
                                            <p className="quiz-review-q">{q.question}</p>
                                            <p className="quiz-review-a">A. {q.answer}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="quiz-result-actions">
                                    <motion.button
                                        className="quiz-btn quiz-btn-primary"
                                        onClick={startGame}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <RotateCcw className="icon-16" />
                                        もう {QUIZ_COUNT} 問挑戦する
                                    </motion.button>
                                    <motion.button
                                        className="quiz-btn quiz-btn-secondary"
                                        onClick={() => {
                                            setPhase("start");
                                            setQuestions([]);
                                            setJudgments([]);
                                            setCurrentIndex(0);
                                            setFlipped(false);
                                        }}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <Home className="icon-16" />
                                        クイズTOPへ戻る
                                    </motion.button>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
