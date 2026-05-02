import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Route, Sparkles, Wrench } from "lucide-react";
import { stampTourSummary } from "../data/stampTour";

const toolCards = [
    {
        id: "stamp-tour",
        eyebrow: "tour support",
        title: "ガルクラスタンプラリー",
        description:
            "缶バッジ販売場所、スタンプ設置場所、営業時間、注意事項を見やすくまとめた非公式サポートページです。",
        path: "/tools/stamp-tour",
        stats: [
            `${stampTourSummary.totalSpots}スポット`,
            `${stampTourSummary.totalCharacters}キャラ`,
        ],
    },
];

export default function ToolsPage() {
    return (
        <div className="shell main-stack">
            <section className="panel tools-hero-panel">
                <div className="tools-hero-layout">
                    <div>
                        <div className="eyebrow sky">helpful tools</div>
                        <h2 className="panel-title">便利ツール</h2>
                        <p className="tools-hero-text">
                            あったらいいなをまとめた補助ページになります。
                            今後ここに便利ツールを追加していく前提で、一覧ページを先に作っています。
                        </p>
                    </div>
                </div>
            </section>

            <section className="panel">
                <div className="panel-head compact no-border">
                    <div>
                        <div className="eyebrow pink">tool list</div>
                        <h3 className="panel-title small-title">現在使えるツール</h3>
                    </div>
                </div>

                <div className="tools-grid">
                    {toolCards.map((tool, index) => (
                        <motion.article
                            key={tool.id}
                            className="tool-card tool-card-featured"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, delay: index * 0.04 }}
                        >
                            <div className="tool-card-header">
                                <div className="tool-card-icon">
                                    <Route className="icon-18" />
                                </div>
                                <div>
                                    <div className="eyebrow sky">{tool.eyebrow}</div>
                                    <h4 className="tool-card-title">{tool.title}</h4>
                                </div>
                            </div>

                            <p className="tool-card-description">{tool.description}</p>

                            <div className="tool-card-stats">
                                {tool.stats.map((stat) => (
                                    <span key={stat} className="tool-card-stat">
                                        <Sparkles className="icon-14" />
                                        {stat}
                                    </span>
                                ))}
                            </div>

                            <div className="tool-card-actions">
                                <Link className="tools-action-button tools-action-button-primary" to={tool.path}>
                                    ページを開く
                                    <ArrowRight className="icon-16" />
                                </Link>
                            </div>
                        </motion.article>
                    ))}

                    <motion.article
                        className="tool-card tool-card-placeholder"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: 0.08 }}
                    >
                        <div className="tool-card-header">
                            <div className="tool-card-icon tool-card-icon-muted">
                                <Wrench className="icon-18" />
                            </div>
                            <div>
                                <div className="eyebrow muted">coming next</div>
                                <h4 className="tool-card-title">今後追加予定</h4>
                            </div>
                        </div>

                        <div className="tool-card-placeholder-note">
                            <Compass className="icon-16" />
                            今はスタンプラリーまとめを掲載中です。
                        </div>
                    </motion.article>
                </div>
            </section>
        </div>
    );
}