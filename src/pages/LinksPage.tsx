import { useState } from "react";
import { motion } from "framer-motion";
import {
    ExternalLink,
    Music4,
    Users,
    ChevronDown,
} from "lucide-react";
import {
    linkSections,
    bands,
    getAllSectionIds,
    getSnsLabel,
    type SnsLink,
    type SnsType,
    type OfficialLinkCard,
    type BandMember,
    type BandInfo,
} from "../data/links";

function cn(...classes: Array<string | false | undefined | null>) {
    return classes.filter(Boolean).join(" ");
}

// ─── SVG icon paths for each SNS type ───

function SnsIcon({ type, className }: { type: SnsType; className?: string }) {
    const size = className;
    switch (type) {
        case "x":
            return (
                <svg className={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            );
        case "instagram":
            return (
                <svg className={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
            );
        case "tiktok":
            return (
                <svg className={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48v-7.1a8.16 8.16 0 004.77 1.53v-3.44a4.85 4.85 0 01-.81.07c-.02 0-.03-.01-.04-.01a4.78 4.78 0 01-.34-4.04z" />
                </svg>
            );
        case "youtube":
            return (
                <svg className={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
            );
        case "official":
            return <ExternalLink className={size} />;
        case "store":
            return (
                <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" x2="21" y1="6" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
            );
    }
}

function snsColorClass(type: SnsType): string {
    switch (type) {
        case "x": return "links-sns-x";
        case "instagram": return "links-sns-instagram";
        case "tiktok": return "links-sns-tiktok";
        case "youtube": return "links-sns-youtube";
        case "official": return "links-sns-official";
        case "store": return "links-sns-store";
    }
}

// ─── Components ───

function SnsButton({ link }: { link: SnsLink }) {
    return (
        <a
            className={cn("links-sns-button", snsColorClass(link.type))}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={getSnsLabel(link.type, link.label)}
        >
            <SnsIcon type={link.type} className="links-sns-icon" />
            <span className="links-sns-label">{getSnsLabel(link.type, link.label)}</span>
        </a>
    );
}

function OfficialCard({ card }: { card: OfficialLinkCard }) {
    return (
        <motion.div
            className="links-official-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
        >
            <div className="links-official-card-name">{card.name}</div>
            {card.description && (
                <div className="links-official-card-desc">{card.description}</div>
            )}
            <div className="links-sns-row">
                {card.links.map((link) => (
                    <SnsButton key={`${link.type}-${link.url}`} link={link} />
                ))}
            </div>
        </motion.div>
    );
}

function MemberCard({ member }: { member: BandMember }) {
    return (
        <motion.div
            className="links-member-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
        >
            <div className="links-member-info">
                <div className="links-member-name">{member.name}</div>
                <div className="links-member-meta">
                    <span className="links-member-role">{member.role} 役</span>
                    <span className="links-member-part">{member.part}</span>
                </div>
            </div>
            {member.links.length > 0 ? (
                <div className="links-sns-row">
                    {member.links.map((link) => (
                        <SnsButton key={`${link.type}-${link.url}`} link={link} />
                    ))}
                </div>
            ) : (
                <div className="links-member-no-sns">SNS未登録</div>
            )}
        </motion.div>
    );
}

function BandSection({ band }: { band: BandInfo }) {
    return (
        <div className="links-band-section" id={`band-${band.name}`}>
            <div className="links-band-header">
                <Music4 className="icon-18 pink-icon" />
                <h3 className="links-band-name">{band.name}</h3>
            </div>

            {band.officialLinks && band.officialLinks.length > 0 && (
                <div className="links-band-official">
                    <div className="links-sub-label">バンド公式</div>
                    <div className="links-official-grid">
                        <OfficialCard
                            card={{ name: band.name, links: band.officialLinks }}
                        />
                    </div>
                </div>
            )}

            <div className="links-sub-label">
                <Users className="icon-14" />
                メンバー / キャスト
            </div>
            <div className="links-members-grid">
                {band.members.map((member) => (
                    <MemberCard key={member.name} member={member} />
                ))}
            </div>
        </div>
    );
}

function SectionJump() {
    const [open, setOpen] = useState(false);
    const sections = getAllSectionIds();

    const handleJump = (id: string) => {
        setOpen(false);
        const el = document.getElementById(id);
        if (!el) return;
        const headerHeight = (document.querySelector(".header-nav") as HTMLElement | null)?.offsetHeight ?? 0;
        const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
        window.scrollTo({ top, behavior: "smooth" });
    };

    return (
        <div className="links-jump">
            <button
                className="links-jump-toggle"
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
            >
                <span>セクションへジャンプ</span>
                <ChevronDown className={cn("icon-16", open && "links-jump-chevron-open")} />
            </button>
            {open && (
                <div className="links-jump-list">
                    {sections.map((s) => (
                        <button
                            key={s.id}
                            className="links-jump-item"
                            type="button"
                            onClick={() => handleJump(s.id)}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Page ───

export default function LinksPage() {
    return (
        <>
            <section className="panel">
                <div className="panel-head">
                    <div>
                        <div className="eyebrow teal">official links</div>
                        <h2 className="panel-title">公式リンク一覧</h2>
                    </div>
                </div>

                <SectionJump />

                {linkSections.map((section) => (
                    <div key={section.id} id={section.id} className="links-section">
                        <div className="links-section-header">
                            <div className="eyebrow pink">{section.eyebrow}</div>
                            <h3 className="links-section-title">{section.title}</h3>
                        </div>
                        <div className="links-official-grid">
                            {section.cards.map((card) => (
                                <OfficialCard key={card.name} card={card} />
                            ))}
                        </div>
                    </div>
                ))}

                <div id="bands" className="links-section">
                    <div className="links-section-header">
                        <div className="eyebrow pink">bands & cast</div>
                        <h3 className="links-section-title">バンド公式 / キャスト</h3>
                    </div>

                    {bands.map((band) => (
                        <BandSection key={band.name} band={band} />
                    ))}
                </div>
            </section>
        </>
    );
}
