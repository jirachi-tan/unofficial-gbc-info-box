import { ExternalLink } from "lucide-react";

export default function LinksPage() {
    return (
        <div className="shell main-stack">
            <section className="panel">
                <div className="panel-head">
                    <div>
                        <div className="eyebrow teal">official links</div>
                        <h2 className="panel-title">公式リンク一覧</h2>
                    </div>
                </div>
                <div className="empty-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
                    <ExternalLink style={{ width: 40, height: 40, margin: "0 auto 1rem", opacity: 0.4 }} />
                    <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>準備中です</p>
                    <p className="muted-text">公式サイトや配信先への導線を整理したページを準備しています。</p>
                </div>
            </section>
        </div>
    );
}
