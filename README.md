# GitHub Management System

## デプロイ先

[GitHub Management を開く](https://git-hub-management.vercel.app)

GitHubの複数リポジトリ、イシュー、プルリクエスト、コミットを一元管理・可視化し、AIを活用した検索や要約、タスク管理、運用監視を行うための統合ダッシュボードシステムです。

---

## 🌟 主な機能

### 1. 目的検索 & ダッシュボード (`/`)
- **直近アクティビティ順表示**: コミット、イシュー、PRの最新更新順にリポジトリを並べて表示。
- **リポジトリ簡易検索**: 入力に応じたリアルタイムフィルタリング。
- **AI要約の展開表示**: リポジトリをクリックすると、READMEを解析したAI要約とプロジェクトURLを表示。
- **プロジェクトURL直接アクセス**: デプロイ先やドキュメントURLをカード上から編集・直接遷移。

### 2. リポジトリ一覧 (`/list`)
- **セマンティック検索（意味検索）**: Google Geminiを活用し、「OCR」「文字認識」「スクレイピング」などの自然言語で目的のリポジトリを高速検索（APIキー未設定時はキーワード検索に自動フォールバック）。
- **多彩なフィルター & ソート**: 言語、公開範囲（Public/Private）、更新日、スター数、作成日順での並び替え。
- **リポジトリ詳細編集**: 説明（Description）、AI要約（Summary）、プロジェクトURL（Custom URL）のインライン編集・DB保存。
- **イシュー / PR一覧タブ**: 全リポジトリ横断でイシューやPRをステータス・担当者別に検索・絞り込み。
- **グリッド / テーブル表示切替**: 用途に応じたレイアウト切り替え。

### 3. カンバンボード (`/kanban`)
- ドラッグ＆ドロップ対応のタスクボード（`@dnd-kit`）。
- イシューとPRのステータス（Backlog / In Progress / In Review / Done）をカード形式で直感的に整理・管理。

### 4. タイムライン (`/timeline`)
- コミット、イシュー作成/クローズ、PR作成/マージなどのイベントを時系列で俯瞰。
- フィルター機能（リポジトリ、イベント種別）付き。

### 5. 運用モニタリング (`/ops`)
- **滞留タスク検知**: 14日以上更新のない放置イシュー、7日以上経過したPRを自動抽出。
- **コミット停止リポジトリ検知**: 30日以上コミットのないリポジトリの可視化。
- **レビュー待ちキュー**: レビューが必要なPRの多いリポジトリをランキング。
- **一括AI要約トリガー**: 説明が未設定のリポジトリに対して一括でGemini要約を生成・保存。

### 6. 知識ベース / ナレッジハブ (`/knowledge`)
- リポジトリごとにカスタムタグや運用メモを付与・管理。
- チーム内の知見蓄積やリポジトリ分類に活用可能。

### 7. 自動化ルール (`/rules`)
- 条件（「更新停滞◯日以上」「スター数◯以上」「ラベル一致」など）に基づき、自動でアラートを生成するルールエンジン。
- 本番反映前の Dry Run（シミュレーション）実行に対応。

### 8. アラートシステム (`/alerts`)
- 自動化ルールや運用監視から発生したアラートの一覧表示・既読管理。
- 手動でのアラート作成・通知管理。

---

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 14 (Pages Router), React 18, `@dnd-kit` (Kanban D&D)
- **バックエンド**: Next.js API Routes
- **データベース / ORM**: PostgreSQL, Prisma ORM (BigInt ID対応, PgBouncerコネクションプーリング対応)
- **AI / LLM**: Google Generative AI SDK (`@google/generative-ai`), Gemini 1.5 Flash / Gemini 2.0 / gemini-3-flash-preview
- **データ収集**: Agent Skills (`agentskills/skills/github-manager`) — GitHub REST API v3 & GraphQL API v4
- **キャッシュ & ストレージ**: Prisma DBキャッシュ + ローカルファイルスナップショット (`data/snapshot.json`) ハイブリッド対応

---

## 🚀 セットアップ手順

### 1. リポジトリのクローン & 依存関係のインストール

```bash
git clone <repository-url>
cd GitHub-Management-standalone
npm install
```

### 2. 環境変数の設定

プロジェクトルート直下に `.env.local` を作成します。

```env
# GitHub 認証（必須）
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=your-github-username

# データベース（推奨: PostgreSQL / Supabase / Neon 等）
DATABASE_URL="postgresql://user:password@localhost:5432/github_management?schema=public"

# Google Gemini AI（推奨: セマンティック検索・README要約機能に使用）
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# 自動同期設定（任意）
NEXT_PUBLIC_AUTO_SYNC=true
NEXT_PUBLIC_AUTO_SYNC_INTERVAL_MINUTES=10
```

#### GitHub Token に必要なスコープ:
- `repo` (プライベートリポジトリの読み取り)
- `read:org` (所属組織のリポジトリ読み取り)
- `read:user` (ユーザー情報の読み取り)

### 3. データベースのセットアップ (Prisma)

DATABASE_URLを設定している場合、Prismaスキーマをデータベースに反映します。

```bash
npm run db:push
```

※ DBを使用しない場合でも、ローカルスナップショット（`data/snapshot.json`）によるファイルモードで動作可能です。

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

---

## 🔄 データ同期の仕組み

1. **GitHubからの自動同期**:
   - 初回起動時や画面上の「同期」ボタン、または `POST /api/sync` によりGitHub APIからリポジトリ・イシュー・PR・コミット情報を取得します。
   - GitHubリポジトリ設定の `homepage`（Vercel等のデプロイ先URL）を自動検出し、プロジェクトURL（`customUrl`）として初期登録します。
2. **レートリミット対策**:
   - スクリプト側に60分のファイルキャッシュ（TTL）を搭載。
   - GitHub APIのレートリミット発生時は、自動的にDBに保存済みの最新データをフォールバックとして返却します。
3. **ヘルスチェック**:
   - `GET /api/health` でGitHub設定状況、DB接続状態、キャッシュ件数を確認できます。

---

## ☁️ Vercel へのデプロイ

1. Vercelに本リポジトリを連携してインポートします（ルートディレクトリのままデプロイ可能）。
2. プロジェクト設定の「Environment Variables」に以下を登録します:
   - `GITHUB_TOKEN` (必須)
   - `GITHUB_USERNAME` (必須)
   - `DATABASE_URL` (推奨: Supabase等のPgBouncer接続文字列 `?pgbouncer=true` も対応)
   - `GEMINI_API_KEY` (推奨)
   - `GEMINI_MODEL` (例: `gemini-1.5-flash`)
   - `NEXT_PUBLIC_AUTO_SYNC`
3. デプロイを実行します。`postinstall` スクリプトにより自動で `prisma generate` が実行されます。

---

## 📁 ディレクトリ構成

```text
.
├── agentskills/              # GitHubデータ収集スクリプト群 (Agent Skills)
│   └── skills/github-manager
│       ├── scripts/          # fetch-repos, fetch-issues, fetch-prs 等
│       └── references/       # GitHub API仕様・リファレンス
├── data/                     # ローカルスナップショット保存先 (snapshot.json)
├── prisma/                   # Prisma ORM スキーマ & マイグレーション
│   └── schema.prisma
├── src/                      # Next.js アプリケーション本体
│   ├── components/           # UIコンポーネント (Dashboard, ListView, Kanban, etc.)
│   ├── contexts/             # グローバル状態管理 (GitHubDataContext)
│   ├── hooks/                # カスタムフック (useFilters 等)
│   ├── lib/                  # ユーティリティ (prisma, gemini, json-store 等)
│   ├── pages/                # Next.js Pages & API Routes
│   │   ├── api/              # バックエンドAPIエンドポイント
│   │   └── *.jsx             # 各画面ページ
│   ├── services/             # クライアント用API通信層 (githubService.js)
│   └── styles/               # グローバルCSS
├── README.md
├── 対応ツール一覧.md
└── 説明_小学生向け.md
```
