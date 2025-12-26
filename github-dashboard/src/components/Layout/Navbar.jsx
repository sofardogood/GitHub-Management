import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navbar({ status, onRefresh }) {
  const router = useRouter();
  const { loading, error } = status;
  const statusLabel = error
    ? '未接続'
    : loading
      ? '同期中'
      : '接続中';
  const links = [
    { href: '/', label: '目的検索' },
    { href: '/list', label: '一覧' },
  ];

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">GH</span>
        <div>
          <div className="brand-title">GitHub 管理コンソール</div>
          <div className="brand-subtitle">検索と一覧に集中</div>
        </div>
      </div>
      <nav className="top-links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={router.pathname === link.href ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="top-actions">
        <span className={`status-pill ${error ? 'error' : loading ? 'loading' : 'ok'}`}>
          {statusLabel}
        </span>
        <button className="ghost-button" onClick={onRefresh} type="button">
          更新
        </button>
      </div>
    </header>
  );
}
