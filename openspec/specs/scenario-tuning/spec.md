# scenario-tuning Specification

## Purpose
TBD - created by archiving change nijirigoke-scenario-too-fast. Update Purpose after archive.
## Requirements
### Requirement: ニジリゴケ変態シナリオの観察可能性

「ニジリゴケ変態」シナリオは、各フェーズ（mobile→bud→flower→withered→繁殖）をユーザーが視覚的に確認できる時間的余裕を持つ初期値で開始しなければならない（SHALL）。

#### Scenario: mobile→bud遷移までの猶予
- **WHEN** ニジリゴケ変態シナリオを開始する
- **THEN** ニジリゴケはmobileフェーズで少なくとも数tickは移動・吸収を行い、即座にbudへ遷移しない

#### Scenario: bud→flower遷移までの猶予
- **WHEN** ニジリゴケがbudフェーズに遷移した
- **THEN** budフェーズで少なくとも数tick吸収を行い、即座にflowerへ遷移しない

