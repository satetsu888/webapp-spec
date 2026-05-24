# WebAppSpec — 関連プロジェクトとの比較

WebAppSpec の位置づけを明確にするため、Web アプリケーションの構造を記述する既存のアプローチと比較する。

---

## ポジショニング

```
                    UI/ナビゲーション中心
                         ↑
              IFML  UWE  │  Appsmith/ToolJet (JSON DSL)
              WebML      │  Vercel json-render
                         │
  コード生成 ←───────────┼───────────→ 仕様定義
        Wasp             │              Context Mapper
        JHipster         │              MDSL
        Amplication      │              StaBL
                         │
              Hasura HML │  ★ WebAppSpec
              Prisma     │
                         ↓
                    ドメイン/ビジネスロジック中心
```

WebAppSpec は「ドメイン中心 × 仕様定義（コード生成しない）」の象限に位置する。この象限は既存プロジェクトが少なく、特に Entity の Ownership・Specs・Reactions・Journey を統合した定義を持つものは他にない。

---

## 古典的 Web モデリング言語（2000〜2015年代）

### WebML (Web Modeling Language)

Politecnico di Milano 発。データモデル・ハイパーテキストモデル（ページ構成・リンク・コンテンツユニット）・ビジネスロジックの3層で Web アプリを記述。商用ツール WebRatio の基盤。

| | WebML | WebAppSpec |
|---|---|---|
| 目的 | モデルから Web アプリを自動生成する（MDA） | アプリの仕様を機械可読な構造として記述する |
| 出力 | 動くコード（JSP/HTML/SQL） | 仕様データ（実装は消費者側が行う） |
| 中核概念 | ページ・リンク・Content Unit | Entity・Transition・Spec・Usecase |
| ビジネスロジック | Operation がページフロー内に埋め込まれる | Usecase として独立し UI から分離 |

WebML は「モデルが実装である」という MDA の立場。WebAppSpec は実装の How（フレームワーク、エンドポイント設計、DB 選定など）を意図的にスコープ外にしている。

### IFML (Interaction Flow Modeling Language)

OMG 標準（2015）。WebML の後継的位置づけで、ユーザーインタラクションのフロー（画面遷移・イベント・アクション）をモデル化。UML が扱えなかった「画面をまたぐ操作の流れ」を明示的に扱う。

| | IFML | WebAppSpec |
|---|---|---|
| 抽象化の対象 | ユーザーインタラクションのフロー | ドメインの構造とビジネスルール |
| 中核概念 | ViewContainer・Event・Action・NavigationFlow | Entity・Transition・Spec・Usecase |
| 非依存の意味 | Web/モバイル/デスクトップどれでも使える | REST/GraphQL/Server Actions どれでも成立する |
| 外部システム | 人間のユーザーと UI のインタラクションが中心 | Actor に外部システム（stripe 等）を含む |

IFML の Event → Action → NavigationFlow という三つ組に対し、WebAppSpec では Component.outputs → View.actions → Usecase → Transition と分解されている。IFML の Action がフロー内のノードであるのに対し、WebAppSpec の Usecase は UI から独立した操作定義。

「画面をまたぐ操作の流れ」への答え方も異なる。IFML は NavigationFlow でフローを明示的にモデル化するが、WebAppSpec は Journey で Actor の目的達成プロセスとして記述する。画面遷移のトポロジーではなく Usecase の列。

IFML は outside-in（UI の振る舞いから）、WebAppSpec は inside-out（ドメインの事実から）のアプローチ。

### UWE (UML-based Web Engineering)

LMU München 発。UML をステレオタイプ拡張（`<<navigationClass>>`, `<<index>>`, `<<menu>>` 等）して、Navigation Model・Presentation Model・Process Model を追加。

| | UWE | WebAppSpec |
|---|---|---|
| 基盤 | UML プロファイル（ステレオタイプ拡張） | 独自の型定義（TypeScript 型 + JSON Schema） |
| 表現形式 | 図（クラス図・アクティビティ図） | データ（JSON） |
| モデル構成 | 5つの分離モデル（Content, Navigation, Presentation, Process, Requirements） | 単一データ構造内にレイヤーを持つ |
| 状態遷移 | 各クラスの Statechart に分散 | Transition を Domain に集約 |
| ビジネスルール | OCL 制約が各所に散在 | Specs として横断的制約を一箇所に集約 |

UWE の根本的な賭けは「UML で十分なはずだ」。WebAppSpec は「消費者が人間ではなくプログラム/LLM なら、UML の図的表現は不要であり、むしろ障害になる」という判断に基づく。

UWE がマルチモデル（モデル間の対応を人間が追跡）であるのに対し、WebAppSpec は単一構造（グラフの一部を切り出して LLM に渡せる）。

### 3者共通の対比

WebML・IFML・UWE はいずれも「UI の構造やフローをいかに精密にモデル化するか」が中心的関心だった。WebAppSpec が根本的に異なるのは、UI のフローではなくドメインの構造的事実とビジネスルールの境界を中心に据え、そこからテスト可能性を引き出そうとしている点。

---

## 現代のアプリケーション定義言語（2018年〜）

### Wasp (Web Application Specification Language) — 2019〜現在

`.wasp` ファイルに `app`, `entity`, `route`, `auth`, `query`, `action` を宣言し、コンパイラが React + Node.js + Prisma を生成する。GitHub 18,000+ stars。WebAppSpec に最も近い既存プロジェクト。

| | Wasp | WebAppSpec |
|---|---|---|
| 目的 | 仕様からコードを生成する | 仕様を定義する（生成はしない） |
| ドメインモデル | Prisma Schema をそのまま埋め込み | Ownership・States/Traits・Transition を独自に持つ |
| ビジネスルール | コードで実装（専用レイヤーなし） | Specs として横断的制約を集約 |
| テスト導出 | スコープ外 | 中核的目的 |
| UI | React ページを直接書く | Component/View で宣言的に定義 |

Wasp は「開発の生産性」に、WebAppSpec は「仕様の網羅性・テスト導出可能性」に最適化している。

### StaBL (State-Based Language) — 2019, 学術

Statechart ベースで Web アプリの振る舞いを形式的に記述する言語（arXiv 1901.02188）。ルート/ナビゲーション、状態遷移、データフローを HTTP や UI の詳細なしに表現する。

「HTTP/UI に依存しない振る舞い定義」という哲学は WebAppSpec と非常に近い。ただし StaBL は Statechart が中心で、ビジネスルール（Specs）やアクター、副作用（Reactions）の分離という設計はない。

### JHipster Domain Language (JDL) — 2016〜現在

アプリケーション・マイクロサービス・エンティティ・リレーション・デプロイメントを宣言的テキストファイルで記述。JHipster が Spring Boot + フロントエンドのコードを生成する。Context Mapper と連携可能。

WebAppSpec との違いはコード生成への強い結合。JDL は「どう作るか」の技術選定（Spring Boot, Angular/React/Vue）を含むが、WebAppSpec は実装技術を意図的にスコープ外にしている。

### Silvera — 2022, 学術

マイクロサービスアーキテクチャの宣言的記述言語（University of Novi Sad）。サービス・API・通信スタイル・デプロイ戦略を記述する。

WebAppSpec とはスコープが異なる（サービス間アーキテクチャ vs 単一アプリ内のドメイン構造）。

---

## DDD・アーキテクチャ記述

### Context Mapper (CML) — 2018〜現在

DDD の Context Map を機械可読に記述する DSL。Bounded Context 間の戦略的関係と戦術的 DDD 概念（Aggregate・Entity・Value Object）を表現する。JHipster JDL・MDSL への変換が可能。

「システム間のドメイン境界」を記述する Context Mapper と「単一アプリ内のドメイン構造」を記述する WebAppSpec はスコープが異なり相補的。

### MDSL (Microservice Domain-Specific Language) — 2018〜現在

マイクロサービス API コントラクトの記述言語。OpenAPI・gRPC・AsyncAPI を単一モデルから生成。Context Mapper と連携。

API の境界定義に特化しており、WebAppSpec の Usecase・Journey・Specs・Reactions のようなアプリ内部の構造は扱わない。

### Structurizr DSL — 2016〜現在

C4 モデルに基づくソフトウェアアーキテクチャの "Models as Code"。Workspace JSON として機械可読。

アーキテクチャドキュメントであり、アプリケーション仕様ではない。抽象度が異なる。

---

## バックエンドスキーマ系

### Hasura Metadata / HML — 2019〜現在

テーブル定義・リレーション・ロール別権限・イベントトリガー・cron を YAML/HML で宣言的に定義。Hasura DDN (v3) ではサブグラフ・コネクタ・モデル・コマンドまで含む。

GraphQL API + 認可 + イベントのフルスタック定義としては最も実用的に普及しているが、データベース中心。WebAppSpec の Usecase（ドメイン操作）、Journey（シナリオ）、Specs（ビジネスルール）のような抽象レイヤーは持たない。

### Prisma Schema Language (PSL) — 2019〜現在

データモデルの宣言的記述。TypeScript/Node.js エコシステムでデファクト標準。Wasp が PSL を内部に埋め込んでいるなど、他ツールへの組み込みも多い。

データモデルに特化しており、WebAppSpec の Domain 層の一部（Entity のフィールド定義と Relation）に相当する。Ownership・States/Traits・Transition・Specs は PSL のスコープ外。

### Amplication — 2020〜現在

エンティティとロール別 CRUD 権限から Node.js バックエンド（REST + GraphQL）を生成。生成コードは人間が編集可能。

コード生成系であり、仕様定義ではない。権限モデルは WebAppSpec の Ownership と一部重なるが、Specs のような横断的ビジネスルールは表現できない。

---

## LLM/AI 時代のアプローチ（2025〜）

### Athena (Apple ML Research) — 2025

LLM によるアプリ生成に中間表現 (IR) を導入した研究（IUI 2025, arXiv 2508.20263）。3つの IR を定義:
- Storyboard — 画面構成とナビゲーションフロー
- Data Model — データ構造
- GUI Skeletons — 画面ごとのコンポーネント配置

IR を使った場合、LLM が生成するアプリの画面数が約2倍、コード行数が約3倍に向上。

「LLM に渡す中間表現があるとコード品質が劇的に上がる」ことを実証しており、WebAppSpec の「LLM による実装」という用途を学術的に支持する。ただし Athena の IR は UI/画面構成が中心で、Transition・Specs・Reactions のようなドメインロジック層は持たない。

### Vercel json-render — 2026

LLM が生成する UI を、開発者が Zod スキーマで定義したコンポーネントカタログに制約する仕組み。13,000+ stars。

「スキーマで LLM の出力を制約する」という思想は WebAppSpec と共通するが、スコープは UI コンポーネントツリーのみ。

### Agent Definition Language (ADL) — 2026

AI エージェントの identity・ロール・ツール・権限・データソースを YAML で定義。「OpenAPI for Agents」を標榜。

WebAppSpec が「Web アプリとは何か」を定義するように、ADL は「AI エージェントとは何か」を定義する。問題の構造が類似しており、WebAppSpec の Actor 概念と接続しうる。

---

## 低コードプラットフォームの内部表現

Appsmith・Lowcoder・ToolJet はいずれもアプリ全体を JSON で保存・エクスポートする。ウィジェットツリー・データソース・クエリ・バインディングが含まれる。

これらは「実装されたアプリの状態を JSON で保存する」のであり、WebAppSpec の「実装前の仕様を定義する」とは方向が逆。画面レイアウトやクエリ SQL を含む具体的な実装の記録であり、WebAppSpec のような抽象的ドメイン定義ではない。

---

## インフラ・デプロイ系（参考）

以下はアプリケーション仕様ではなくインフラ/デプロイの定義だが、「宣言的にアプリの構造を記述する」という広い意味で関連する。

- **Winglang** (2022) — クラウドインフラとアプリランタイムを単一言語で統合
- **Encore.ts/go** (2021) — TypeScript/Go コード内にインフラ意図を型として埋め込む
- **CNCF Serverless Workflow DSL** (2020) — イベント駆動ワークフローの YAML/JSON 標準
- **Launchfile** (2023) — 「Dockerfile for deployment」。ビルド・ネットワーク・依存リソースの宣言的定義

---

## WebAppSpec の独自性

調査の結果、WebAppSpec が占める領域の特徴が明確になった:

1. **ドメイン中心 × 仕様定義（コード生成しない）の象限が空いている。** Wasp（最も近い）はコード生成に結合しており、Context Mapper はシステム間境界に特化している。
2. **Ownership・Specs・Reactions・Journey の統合は他にない。** 個別の概念は他ツールにも存在するが、これらを単一構造に統合してテスト導出可能にした設計は独自。
3. **LLM 時代の仕様記述としての設計が明確。** Athena が実証した「中間表現の有効性」を、ドメインロジック層まで拡張している。
4. **Specs の独立レイヤーは比較対象がない。** ビジネスルールの横断的制約を Transition と疎結合に保つ設計は、既存のどのアプローチにも見られない。
