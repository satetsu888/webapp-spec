# @webapp-spec/validator

WebAppSpec の意味的バリデーションライブラリ。参照整合性やルール違反を検出する。CLI 機能は `@webapp-spec/cli`（`wspec` コマンド）に統合済み。

## コマンド

```sh
npx tsc              # ビルド（types パッケージを先にビルドしておくこと）
npx vitest run       # テスト実行
```

## アーキテクチャ

```
src/
  semver.ts           # semver 比較関数（外部依存なし）
  validator.ts        # ValidationIssue/ValidationResult 型定義、VersionedRule、ルール集約
  rules/
    references.ts     # 参照整合性（entity, field, state, actor, transition 等の存在チェック）
    uniqueness.ts     # ID・名前の一意性、予約語チェック
    transitions.ts    # 状態遷移の整合性（scope:related の Relation 要件、到達不能状態、ライフサイクル）
    operations.ts     # Operation の整合性（target-transition 一致、anonymous アクセス、followUp）
    specs.ts          # Spec のカバレッジ（trait family の網羅性ヒューリスティック）
    scenarios.ts      # Scenario の actor 一致チェック、view-action 整合性
    ui.ts             # Component の transform 整合性、View の inputFrom マッピング
    sideeffects.ts    # SideEffect の trigger entity 一致、when 条件の field 参照
    unused.ts         # 未使用定義の検出
    entities.ts       # Entity の構造チェック（states 必須）
    actors.ts         # Actor の構造チェック（anonymous 存在）
    fixtures.ts       # Fixture の整合性（entity 参照、field 存在、state 値、インスタンス参照）
tests/
  validator.test.ts   # vitest テスト
```

## 公開 API

- `validate(spec: WebAppSpec): ValidationResult` — 意味バリデーション実行
- `ValidationIssue`, `ValidationResult`, `Severity`, `VersionedRule` — 型定義
- `SUPPORTED_SPEC_VERSION` — サポートする spec バージョン

各ルールファイルは `(spec: WebAppSpec) => ValidationIssue[]` を返す関数をエクスポートする。`validator.ts` が `VersionedRule`（`fn` + `minVersion` + `maxVersion?`）として登録し、`spec.webappSpec` のバージョンに応じてフィルタして実行する。`SUPPORTED_SPEC_VERSION` より新しい spec はエラーで即 return する。

## バリデーションルール一覧

### Error（整合性が壊れている）

| rule | ファイル | 内容 |
|------|----------|------|
| `version.unsupported` | validator.ts | spec.webappSpec が SUPPORTED_SPEC_VERSION より新しい |
| `ref.entity` | references.ts | 存在しない Entity への参照 |
| `ref.field` | references.ts | 存在しない Field への参照（ownership, state, datasource, sort, condition 内） |
| `ref.state` | references.ts | 存在しない State への参照（transition の from/to） |
| `ref.state-trait` | references.ts | 存在しない State/Trait への参照（matching） |
| `ref.trait` | references.ts | 存在しない Trait への参照（condition 内） |
| `ref.actor` | references.ts | 存在しない Actor への参照 |
| `ref.transition` | references.ts | 存在しない Transition への参照 |
| `ref.operation` | references.ts | 存在しない Operation への参照 |
| `ref.component` | references.ts | 存在しない Component への参照 |
| `ref.relation` | references.ts | 存在しない Relation への参照 |
| `ref.scenario` | references.ts | 存在しない Scenario への参照 |
| `ref.view` | references.ts | 存在しない View への参照 |
| `transition.pseudo-state` | references.ts | `_start` を to に、`_end` を from に使用 |
| `transition.entity-relation` | transitions.ts | scope:"related" で Relation が未定義 |
| `transition.no-creation` | transitions.ts | Entity に `_start` からの遷移がない（作成パスなし） |
| `unique.*-id` | uniqueness.ts | 各定義の ID 重複（entity, relation, transition, spec, actor, operation, scenario, component, view, fixture） |
| `unique.field-name` | uniqueness.ts | Entity 内の field 名重複 |
| `unique.state-name` | uniqueness.ts | Entity 内の state 名重複 |
| `unique.trait-name` | uniqueness.ts | Entity 内の trait 名重複 |
| `unique.reserved-state-name` | uniqueness.ts | `_start`/`_end` を state 名に使用 |
| `unique.state-trait-collision` | uniqueness.ts | 同一 Entity 内で state と trait の名前が衝突 |
| `operation.transition-target` | operations.ts | Operation の target entity と Transition の target entity 不一致 |
| `sideeffect.entity` | sideeffects.ts | SideEffect の trigger.entity と Operation の target entity 不一致 |
| `sideeffect.field` | sideeffects.ts | SideEffect の when 条件が参照する field が Entity に未定義 |
| `ui.transform-input` | ui.ts | Transform の from が sources/inputs に存在しない |
| `ui.transform-output` | ui.ts | Transform の to が displays/outputs に存在しない |
| `view.input-mapping` | ui.ts | inputFrom の形式不正、参照先 component/output の不在 |
| `view.operation-input` | ui.ts | Operation の input が View でマッピングされていない |
| `entity.no-states` | entities.ts | Entity に states が定義されていない |
| `scenario.view-action-mismatch` | scenarios.ts | Scenario step の action が View の actions に定義されていない |
| `fixture.entity-ref` | fixtures.ts | Fixture instance が存在しない Entity を参照 |
| `fixture.unknown-field` | fixtures.ts | Fixture instance に Entity に未定義のフィールドがある |
| `fixture.duplicate-instance-id` | fixtures.ts | 同一 Fixture 内でインスタンス ID が重複 |

### Warning（疑わしい定義）

| rule | ファイル | 内容 |
|------|----------|------|
| `unused.transition` | unused.ts | どの Operation からも参照されない Transition |
| `unused.actor` | unused.ts | どの Operation・Scenario からも参照されない Actor |
| `unused.operation` | unused.ts | どの Scenario・View・SideEffect・followUp からも参照されない Operation |
| `unused.component` | unused.ts | どの View からも参照されない Component |
| `unused.entity` | unused.ts | どこからも参照されない Entity |
| `unused.view` | unused.ts | どの Scenario からも参照されない View |
| `transition.unreachable` | transitions.ts | どの Transition からも到達・出発できない State |
| `operation.anonymous-ownership` | operations.ts | anonymous actor で personal/group リソースにアクセス |
| `operation.followup-actor` | operations.ts | followUp が人間 actor で定義されている |
| `operation.followup-cycle` | operations.ts | followUps の循環参照 |
| `spec.incomplete-coverage` | specs.ts | trait family の一部しかカバーしていない Spec |
| `scenario.actor-mismatch` | scenarios.ts | Scenario の actor と step の operation/scenario の actor 不一致 |
| `actor.no-anonymous` | actors.ts | anonymous actor が定義されていない |
| `fixture.invalid-state-value` | fixtures.ts | state 用フィールドの値が定義済み state value と不一致 |
| `fixture.instance-ref` | fixtures.ts | Entity.id 型フィールドの値が同一 Fixture 内のインスタンスに存在しない |

### Info（参考情報）

| rule | ファイル | 内容 |
|------|----------|------|
| `transition.no-deletion` | transitions.ts | Entity に `_end` への遷移がない（削除パスなし） |

## ルール追加時の手順

1. `src/rules/` 内の該当ファイルにチェックを追加（または新規ファイル作成）
2. 新規ファイルの場合は `validator.ts` の `allRules` 配列に追加
3. `tests/validator.test.ts` にテストを追加
4. エラーメッセージは英語で記述
