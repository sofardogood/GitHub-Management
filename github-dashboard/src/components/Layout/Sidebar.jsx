import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Sidebar() {
  const router = useRouter();
  const primaryLinks = [
    { href: '/', label: '目的検索' },
    { href: '/list', label: 'リポジトリ一覧' },
  ];
  const secondaryLinks = [
    { href: '/kanban', label: 'カンバン' },
    { href: '/timeline', label: 'タイムライン' },
    { href: '/ops', label: '運用モニタリング' },
    { href: '/knowledge', label: '知識ベース' },
    { href: '/rules', label: '自動化ルール' },
    { href: '/alerts', label: 'アラート' },
  ];

  const renderLinks = (links) =>
    links.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        className={router.pathname === link.href ? 'active' : ''}
      >
        {link.label}
      </Link>
    ));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">管理パネル</div>
        <p>目的検索と一覧を中心に整理。</p>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">メイン</div>
          {renderLinks(primaryLinks)}
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">その他</div>
          {renderLinks(secondaryLinks)}
        </div>
      </nav>
      <div className="sidebar-footer">
        <span>GitHub API v3 + v4</span>
        <span>Agent Skills 有効</span>
      </div>
    </aside>
  );
}