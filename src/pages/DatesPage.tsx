import { CalendarDays } from "lucide-react";

export default function DatesPage() {
    return (
        <div className="shell main-stack">
            <section className="panel">
                <div className="panel-head">
                    <div>
                        <div className="eyebrow pink">anniversary list</div>
                        <h2 className="panel-title">記念日一覧</h2>
                    </div>
                </div>
                <div className="empty-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
                    <CalendarDays style={{ width: 40, height: 40, margin: "0 auto 1rem", opacity: 0.4 }} />
                    <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>準備中です</p>
                    <p className="muted-text">誕生日や周年などの記念日情報をまとめたページを準備しています。</p>
                </div>
            </section>
        </div>
    );
}
