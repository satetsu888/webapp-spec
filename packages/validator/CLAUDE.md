# @webapp-spec/validator

WebAppSpec の意味的バリデーター。JSON Schema による構造チェック（ajv）の後に、参照整合性やルール違反を検出する。

## コマンド

```sh
npx tsc              # ビルド（types パッケージを先にビルドしておくこと）
npx vitest run       # テスト実行
npx webapp-spec-validate <spec.json>  # CLI
```

## アーキテクチャ

```
src/
  validator.ts        # ValidationIssue/ValidationResult 型定義、ルール集約
  rules/
    references.ts     # 参照整合性（entity, field, state, actor, transition 等の存在チェック）
    uniqueness.ts     # ID・名前の一意性、予約語チェック
    transitions.ts    # 状態遷移の整合性（scope:related の Relation 要件、到達不能状態）
    usecases.ts       # Usecase の整合性（target-transition 一致、anonymous アクセス、followUp）
    specs.ts          # Spec のカバレッジ（trait family の網羅性ヒューリスティック）
    journeys.ts       # Journey の actor 一致チェック
    ui.ts             # Component の transform 整合性、View の inputFrom マッピング
    reactions.ts      # Reaction の trigger entity 一致、when 条件の field 参照
    unused.ts         # 未使用定義の検出
  index.ts            # CLI エントリポイント（JSON Schema + 意味バリデーション）
tests/
  validator.test.ts   # vitest テスト
```

各ルールファイルは `(spec: WebAppSpec) => ValidationIssue[]` を返す関数をエクスポートし、`validator.ts` が集約する。

## バリデーションルール一覧

### Error（整合性が壊れている）

| rule | ファイル | 内容 |
|------|----------|------|
| `ref.entity` | references.ts | 存在しない Entity への参照 |
| `ref.field` | references.ts | 存在しない Field への参照（ownership, state, datasource, sort, condition 内） |
| `ref.state` | references.ts | 存在しない State への参照（transition の from/to） |
| `ref.state-trait` | references.ts | 存在しない State/Trait への参照（matching） |
| `ref.trait` | references.ts | 存在しない Trait への参照（condition 内） |
| `ref.actor` | references.ts | 存在しない Actor への参照 |
| `ref.transition` | references.ts | 存在しない Transition への参照 |
| `ref.usecase` | references.ts | 存在しない Usecase への参照 |
| `ref.component` | references.ts | 存在しない Component への参照 |
| `ref.relation` | references.ts | 存在しない Relation への参照 |
| `ref.journey` | references.ts | 存在しない Journey への参照 |
| `transition.pseudo-state` | references.ts | `_start` を to に、`_end` を from に使用 |
| `transition.entity-relation` | transitions.ts | scope:"related" で Relation が未定義 |
| `unique.*-id` | uniqueness.ts | 各定義の ID 重複 |
| `unique.field-name` | uniqueness.ts | Entity 内の field 名重複 |
| `unique.state-name` | uniqueness.ts | Entity 内の state 名重複 |
| `unique.trait-name` | uniqueness.ts | Entity 内の trait 名重複 |
| `unique.reserved-state-name` | uniqueness.ts | `_start`/`_end` を state 名に使用 |
| `unique.state-trait-collision` | uniqueness.ts | 同一 Entity 内で state と trait の名前が衝突 |
| `usecase.transition-target` | usecases.ts | Usecase の target entity と Transition の target entity 不一致 |
| `reaction.entity` | reactions.ts | Reaction の trigger.entity と Usecase の target entity 不一致 |
| `reaction.field` | reactions.ts | Reaction の when 条件が参照する field が Entity に未定義 |
| `ui.transform-input` | ui.ts | Transform の from が sources/inputs に存在しない |
| `ui.transform-output` | ui.ts | Transform の to が displays/outputs に存在しない |
| `view.input-mapping` | ui.ts | inputFrom の形式不正、参照先 component/output の不在 |
| `view.usecase-input` | ui.ts | Usecase の input が View でマッピングされていない |

### Warning（疑わしい定義）

| rule | ファイル | 内容 |
|------|----------|------|
| `unused.transition` | unused.ts | どの Usecase からも参照されない Transition |
| `unused.actor` | unused.ts | どの Usecase・Journey からも参照されない Actor |
| `unused.usecase` | unused.ts | どの Journey・View・Reaction・followUp からも参照されない Usecase |
| `unused.component` | unused.ts | どの View からも参照されない Component |
| `unused.entity` | unused.ts | どこからも参照されない Entity |
| `transition.unreachable` | transitions.ts | どの Transition からも到達・出発できない State |
| `usecase.anonymous-ownership` | usecases.ts | anonymous actor で personal/group リソースにアクセス |
| `usecase.followup-actor` | usecases.ts | followUp が人間 actor で定義されている |
| `usecase.followup-cycle` | usecases.ts | followUps の循環参照 |
| `spec.incomplete-coverage` | specs.ts | trait family の一部しかカバーしていない Spec |
| `journey.actor-mismatch` | journeys.ts | Journey の actor と step の usecase/journey の actor 不一致 |

## ルール追加時の手順

1. `src/rules/` 内の該当ファイルにチェックを追加（または新規ファイル作成）
2. 新規ファイルの場合は `validator.ts` の `allRules` 配列に追加
3. `tests/validator.test.ts` にテストを追加
4. エラーメッセージは英語で記述
