import { HelpCircle } from "lucide-react";

export default function QuizPage() {
    return (
        <div className="shell main-stack">
            <section className="panel">
                <div className="panel-head">
                    <div>
                        <div className="eyebrow violet">quiz challenge</div>
                        <h2 className="panel-title">クイズに挑戦</h2>
                    </div>
                </div>
                <div className="empty-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
                    <HelpCircle style={{ width: 40, height: 40, margin: "0 auto 1rem", opacity: 0.4 }} />
                    <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>準備中です</p>
                    <p className="muted-text">作品や楽曲に関するクイズ企画を準備しています。</p>
                </div>
            </section>
        </div>
    );
}
