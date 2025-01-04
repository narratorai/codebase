## [4.5.3](https://github.com/narratorai/the-sequel/compare/v4.5.2...v4.5.3) (2022-12-06)


### Bug Fixes

* bump webpack and typescript ([2f80a24](https://github.com/narratorai/the-sequel/commit/2f80a24eb03d61b14172552c628073d80217f7b6))

## [4.5.2](https://github.com/narratorai/the-sequel/compare/v4.5.1...v4.5.2) (2022-09-21)


### Bug Fixes

* sql block is default item for autocomplete ([1932832](https://github.com/narratorai/the-sequel/commit/1932832738ebf622b60f4cb873e5c814f62b53c1))

## [4.5.1](https://github.com/narratorai/the-sequel/compare/v4.5.0...v4.5.1) (2022-08-29)


### Bug Fixes

* let's actually just straight up html comments ([5f573f5](https://github.com/narratorai/the-sequel/commit/5f573f5f1362571cfed075c5e862e4daf2ab4d91))
* markdown comments should end with two dashes ([61271c6](https://github.com/narratorai/the-sequel/commit/61271c6a142ec7bf188afe1a57b555fda9e66308))

# [4.5.0](https://github.com/narratorai/the-sequel/compare/v4.4.3...v4.5.0) (2022-08-12)


### Features

* markdown autocomplete ([e580b02](https://github.com/narratorai/the-sequel/commit/e580b023d0112cb51c5c7bcb4256f7dcb8af9832))

## [4.4.3](https://github.com/narratorai/the-sequel/compare/v4.4.2...v4.4.3) (2022-05-05)


### Bug Fixes

* ensure the line numbers function doesn't get stomped on by props from the parent ([c06a75c](https://github.com/narratorai/the-sequel/commit/c06a75c968a2713d9d0b2f488f17c060a0398eaa))

## [4.4.2](https://github.com/narratorai/the-sequel/compare/v4.4.1...v4.4.2) (2022-03-11)


### Bug Fixes

* make runQuery optional ([2b4884f](https://github.com/narratorai/the-sequel/commit/2b4884fad83c274ea579b7f09d7d0191f6300de2))

## [4.4.1](https://github.com/narratorai/the-sequel/compare/v4.4.0...v4.4.1) (2022-02-23)


### Bug Fixes

* mardownEditor getValueRef and isInSqlBlock ([97356a4](https://github.com/narratorai/the-sequel/commit/97356a4395fcc5b48632bae48fcc3b16142fcb2b))

# [4.4.0](https://github.com/narratorai/the-sequel/compare/v4.3.2...v4.4.0) (2022-02-18)


### Features

* line nums in markdown and better wrapping ([60b1571](https://github.com/narratorai/the-sequel/commit/60b1571f600c1706e940a0e5a2ea6c9e01401d9d))

## [4.3.2](https://github.com/narratorai/the-sequel/compare/v4.3.1...v4.3.2) (2022-02-16)


### Bug Fixes

* significantly speed up currentQueryRange (WIP) ([5a17703](https://github.com/narratorai/the-sequel/commit/5a1770382717aa2870e9286e36e8480a8251fb41))
* speed up currentQueryRange ([860bd03](https://github.com/narratorai/the-sequel/commit/860bd03c2bd5fd8919516c45090fbf316cf14639))

## [4.3.1](https://github.com/narratorai/the-sequel/compare/v4.3.0...v4.3.1) (2022-02-09)


### Bug Fixes

* removed sql query decorators for performance ([9ccc1e2](https://github.com/narratorai/the-sequel/commit/9ccc1e2bb94e0c59b70989c5e83c3224e6059d4a))

# [4.3.0](https://github.com/narratorai/the-sequel/compare/v4.2.0...v4.3.0) (2021-11-23)


### Features

* support for async autocomplete ([43e2701](https://github.com/narratorai/the-sequel/commit/43e27018cce81949adef50c3c0d0a1da82d93ea6))

# [4.2.0](https://github.com/narratorai/the-sequel/compare/v4.1.0...v4.2.0) (2021-10-26)


### Features

* python support ([3a5d6df](https://github.com/narratorai/the-sequel/commit/3a5d6df2a50643c56ba3e4e15a23f6a52644776a))

# [4.1.0](https://github.com/narratorai/the-sequel/compare/v4.0.0...v4.1.0) (2021-09-09)


### Features

* add an async basic completion service ([8864014](https://github.com/narratorai/the-sequel/commit/88640146b113e26f33b04af7da7117da9cc44ae7))

# [4.0.0](https://github.com/narratorai/the-sequel/compare/v3.1.0...v4.0.0) (2021-09-01)


* feat!: remove ag-grid from the-sequel ([ab5d56f](https://github.com/narratorai/the-sequel/commit/ab5d56fe994d89bde1ce12acd66d3238399de784))


### BREAKING CHANGES

* DataTable is gone

# [3.1.0](https://github.com/narratorai/the-sequel/compare/v3.0.5...v3.1.0) (2021-08-26)


### Bug Fixes

* only import monaco, not monaco-editor ([3b1b8f9](https://github.com/narratorai/the-sequel/commit/3b1b8f94552f3845d0621849e809d10bb61f1cdb))


### Features

* bundle only the parts of monaco we need ([638b0dc](https://github.com/narratorai/the-sequel/commit/638b0dc04c5a0c6a577b5b78da3b63e1c267a6eb))

## [3.0.5](https://github.com/narratorai/the-sequel/compare/v3.0.4...v3.0.5) (2021-08-25)


### Bug Fixes

* upgrade react-monaco-editor ([d77e8a5](https://github.com/narratorai/the-sequel/commit/d77e8a5c65257d680a23f3993a118e076327abc9))

## [3.0.4](https://github.com/narratorai/the-sequel/compare/v3.0.3...v3.0.4) (2021-07-30)


### Bug Fixes

* autocomplete support for schemas with dashes (bigquery: my-project) ([4cfd0f4](https://github.com/narratorai/the-sequel/commit/4cfd0f4d8f969349ca0d7b79cb9f2d4a21f42989))

## [3.0.3](https://github.com/narratorai/the-sequel/compare/v3.0.2...v3.0.3) (2021-07-09)


### Bug Fixes

* undo small regression from last PR ([f70cf64](https://github.com/narratorai/the-sequel/commit/f70cf641c9e8b1ab34384ac101fc1ac2e92ec165))

## [3.0.2](https://github.com/narratorai/the-sequel/compare/v3.0.1...v3.0.2) (2021-07-09)


### Bug Fixes

* autocomplete support for schema names with a '.' in them ([f5e48d1](https://github.com/narratorai/the-sequel/commit/f5e48d1974cb853a28068e27759487e5d642c284))

## [3.0.1](https://github.com/narratorai/the-sequel/compare/v3.0.0...v3.0.1) (2021-06-23)


### Bug Fixes

* bump ag-grid to latest ([8cecdd5](https://github.com/narratorai/the-sequel/commit/8cecdd5e22dd6533e9af6e1d3c3255dd349e456e))

# [3.0.0](https://github.com/narratorai/the-sequel/compare/v2.10.3...v3.0.0) (2021-06-14)


### Features

* upgrade to monaco-editor 0.25.x ([a6b376e](https://github.com/narratorai/the-sequel/commit/a6b376eda8b708e161eb318dece3e42cc8b449bd))


### BREAKING CHANGES

* requires an update to `monaco-editor-webpack-plugin` for users of this package

## [2.10.3](https://github.com/narratorai/the-sequel/compare/v2.10.2...v2.10.3) (2021-01-20)


### Bug Fixes

* debounce the query decoration ([3fe5f81](https://github.com/narratorai/the-sequel/commit/3fe5f81beb704d404d402bbaca13d9dfa6fe159e))

## [2.10.2](https://github.com/narratorai/the-sequel/compare/v2.10.1...v2.10.2) (2020-09-22)


### Bug Fixes

* added a ref to get to the editor instance ([37cf20e](https://github.com/narratorai/the-sequel/commit/37cf20efb6b547e97560e0a3a4574f0c6d68e341))

## [2.10.1](https://github.com/narratorai/the-sequel/compare/v2.10.0...v2.10.1) (2020-07-19)


### Bug Fixes

* auto resize more often ([117b95f](https://github.com/narratorai/the-sequel/commit/117b95f9bd4821494faa9dd18de08a6e84e584be))

# [2.10.0](https://github.com/narratorai/the-sequel/compare/v2.9.1...v2.10.0) (2020-07-14)


### Features

* add value to onBlur args ([30895f1](https://github.com/narratorai/the-sequel/commit/30895f19230c1263cb8d26648329b63f3ee6b690))

## [2.9.1](https://github.com/narratorai/the-sequel/compare/v2.9.0...v2.9.1) (2020-07-08)


### Bug Fixes

* fix cursor in markdown sql code block snippet ([18f2fab](https://github.com/narratorai/the-sequel/commit/18f2fabe77a19a3a95d888e51e0779682287a664))

# [2.9.0](https://github.com/narratorai/the-sequel/compare/v2.8.5...v2.9.0) (2020-07-07)


### Features

* added sql snippet in the sql markdown editor ([13d6c10](https://github.com/narratorai/the-sequel/commit/13d6c104fdaf0ad1526267489913a207d501219d))

## [2.8.5](https://github.com/narratorai/the-sequel/compare/v2.8.4...v2.8.5) (2020-07-02)


### Performance Improvements

* new release to pick up dependency changes ([5f7c681](https://github.com/narratorai/the-sequel/commit/5f7c681ed1cc370356e69e5c0cafd5d7c682f3ab))

## [2.8.4](https://github.com/narratorai/the-sequel/compare/v2.8.3...v2.8.4) (2020-06-03)


### Bug Fixes

* avoid line number going out of range ([2c74f15](https://github.com/narratorai/the-sequel/commit/2c74f15f8563a00d4b3f37d1377aba56e29d846d))

## [2.8.3](https://github.com/narratorai/the-sequel/compare/v2.8.2...v2.8.3) (2020-05-29)


### Bug Fixes

* semicolons in strings should not end statements ([bf728f1](https://github.com/narratorai/the-sequel/commit/bf728f1d33d7e1310af25e73c1cc4c55a8918099))

## [2.8.2](https://github.com/narratorai/the-sequel/compare/v2.8.1...v2.8.2) (2020-05-20)


### Bug Fixes

* match sql blocks better when they are followed by more  whitespace ([2234a8f](https://github.com/narratorai/the-sequel/commit/2234a8fa74320c140b1e7a1dda8d89da14268ef2))

## [2.8.1](https://github.com/narratorai/the-sequel/compare/v2.8.0...v2.8.1) (2020-05-20)


### Bug Fixes

* support unclosed sql blocks too ([0bf393a](https://github.com/narratorai/the-sequel/commit/0bf393a557d71c6ca20774d5c297f50b4628b028))

# [2.8.0](https://github.com/narratorai/the-sequel/compare/v2.7.0...v2.8.0) (2020-05-19)


### Features

* a Markdown editor that can author sql ([3e65bc1](https://github.com/narratorai/the-sequel/commit/3e65bc1035bf5f06e43b5b95441b017044eb6dbb))

# [2.7.0](https://github.com/narratorai/the-sequel/compare/v2.6.1...v2.7.0) (2020-05-16)


### Bug Fixes

* don't swallow scroll messages ([2cd40fc](https://github.com/narratorai/the-sequel/commit/2cd40fc96e15501503d82ad32a88dcc7cafdac7c))


### Features

* support automatically resizing to 100% ([dc5c71f](https://github.com/narratorai/the-sequel/commit/dc5c71f277cdc6815afb1f8d0be1b3ceae392caf))

## [2.6.1](https://github.com/narratorai/the-sequel/compare/v2.6.0...v2.6.1) (2020-05-15)


### Bug Fixes

* compute auto height on every render ([4fd3947](https://github.com/narratorai/the-sequel/commit/4fd3947b68d7fb897476bcefdf3bae0bfcebd8b3))

# [2.6.0](https://github.com/narratorai/the-sequel/compare/v2.5.9...v2.6.0) (2020-05-14)


### Bug Fixes

* remove the opacity for disabled editors ([9b346b5](https://github.com/narratorai/the-sequel/commit/9b346b57be1a1afd7495ef39e6938c13165a62ae))


### Features

* auto height -- resizes to fit content ([a734ff7](https://github.com/narratorai/the-sequel/commit/a734ff7e8ba152f5239332cf9aac3c82ca02bec5))

## [2.5.9](https://github.com/narratorai/the-sequel/compare/v2.5.8...v2.5.9) (2020-05-14)


### Bug Fixes

* default to word wrap on ([73931c0](https://github.com/narratorai/the-sequel/commit/73931c07eeecbb30ef914043e409fa3b7301b5b5))

## [2.5.8](https://github.com/narratorai/the-sequel/compare/v2.5.7...v2.5.8) (2020-04-28)


### Bug Fixes

* cleaner editor styles by default ([0e8a9a4](https://github.com/narratorai/the-sequel/commit/0e8a9a45702e78f1254e11cb1c006efec608a217))

## [2.5.7](https://github.com/narratorai/the-sequel/compare/v2.5.6...v2.5.7) (2020-04-24)


### Bug Fixes

* llow autocomplete loading even without trigger characters ([dae8fa6](https://github.com/narratorai/the-sequel/commit/dae8fa6c4524d45999e90b7446012daf27a0ecf0))

## [2.5.6](https://github.com/narratorai/the-sequel/compare/v2.5.5...v2.5.6) (2020-04-24)


### Bug Fixes

* allow BasicEditor to get new autocomplete provider live ([8030cb7](https://github.com/narratorai/the-sequel/commit/8030cb7b31e8e111e086893e61c9c9c94fdb43c5))

## [2.5.5](https://github.com/narratorai/the-sequel/compare/v2.5.4...v2.5.5) (2020-04-23)


### Bug Fixes

* still highlight a header if it has {#variable} in it ([a6e9f9c](https://github.com/narratorai/the-sequel/commit/a6e9f9cad5593481a09479e52c59712d33517d2f))

## [2.5.4](https://github.com/narratorai/the-sequel/compare/v2.5.3...v2.5.4) (2020-04-17)


### Bug Fixes

* allow autocomplete only between delimiters ([5c0989b](https://github.com/narratorai/the-sequel/commit/5c0989b9424e09b94cd4c2341976755b2cb616e2))
* tokenizer for Markdown to support autocomplete in curly braces ([ec0893d](https://github.com/narratorai/the-sequel/commit/ec0893d7dbf8fbdbb0515999f582ac71b7b41c4a))

## [2.5.3](https://github.com/narratorai/the-sequel/compare/v2.5.2...v2.5.3) (2020-04-13)


### Bug Fixes

* removed console log ([c2f19a3](https://github.com/narratorai/the-sequel/commit/c2f19a3bf7d339db4004ce1872687ef95d84032d))

## [2.5.2](https://github.com/narratorai/the-sequel/compare/v2.5.1...v2.5.2) (2020-04-13)


### Bug Fixes

* make a copy of autocomplete list ([17c281b](https://github.com/narratorai/the-sequel/commit/17c281bc57809e1344b27a7830ee66aa74d8e67e))

## [2.5.1](https://github.com/narratorai/the-sequel/compare/v2.5.0...v2.5.1) (2020-04-13)


### Bug Fixes

* minor wording fix on error message ([01f235c](https://github.com/narratorai/the-sequel/commit/01f235c779a29083a674f17c2f1abec31e48528a))

# [2.5.0](https://github.com/narratorai/the-sequel/compare/v2.4.5...v2.5.0) (2020-04-13)


### Features

* basic completion service ([8f9bf4c](https://github.com/narratorai/the-sequel/commit/8f9bf4cb451e6c631c091f3bdd3d14680098f72f))

## [2.4.5](https://github.com/narratorai/the-sequel/compare/v2.4.4...v2.4.5) (2020-04-07)


### Bug Fixes

* only one autocomplete provider per editor instance ([cc58ead](https://github.com/narratorai/the-sequel/commit/cc58ead494d230c7c979c642edce61d760a69c94))

## [2.4.4](https://github.com/narratorai/the-sequel/compare/v2.4.3...v2.4.4) (2020-03-25)


### Bug Fixes

* really fix font public path ([f555fd8](https://github.com/narratorai/the-sequel/commit/f555fd8576fb8e95faaecc1a71dc438b48d995b9))

## [2.4.3](https://github.com/narratorai/the-sequel/compare/v2.4.2...v2.4.3) (2020-03-25)


### Bug Fixes

* fixup font public path ([1a9092f](https://github.com/narratorai/the-sequel/commit/1a9092fa4c51ed41089a67b7e9bf972d673b21d4))

## [2.4.2](https://github.com/narratorai/the-sequel/compare/v2.4.1...v2.4.2) (2020-03-25)


### Bug Fixes

* name the font in the bundle ([fb0e96f](https://github.com/narratorai/the-sequel/commit/fb0e96ff74e5f109fe39bad85a1b00e437032a49))
* point build to assets.narrator.ai for font ([6f66e62](https://github.com/narratorai/the-sequel/commit/6f66e623fd87f4ad5b4d8f300645c93433ad9b09))
* remove hash from font filename in dist ([da65d9e](https://github.com/narratorai/the-sequel/commit/da65d9e68152fcf06e21288254d4a603dc907111))
* set up publish to upload static to assets CDN ([8d817c4](https://github.com/narratorai/the-sequel/commit/8d817c4ec853c7162778f8e38ecbb88527e7e0e8))

## [2.4.1](https://github.com/narratorai/the-sequel/compare/v2.4.0...v2.4.1) (2020-03-24)


### Bug Fixes

* empty object does not cancel disabled when switching disabled prop ([caba1e0](https://github.com/narratorai/the-sequel/commit/caba1e0a4bfd3231e6a592965ed91f3fc0384d43))

# [2.4.0](https://github.com/narratorai/the-sequel/compare/v2.3.2...v2.4.0) (2020-03-24)


### Features

* add disabled support to BasicEditor ([01f3dca](https://github.com/narratorai/the-sequel/commit/01f3dcadce60e329d97afeae5b4194edf3cb6f7a))

## [2.3.2](https://github.com/narratorai/the-sequel/compare/v2.3.1...v2.3.2) (2020-03-22)


### Bug Fixes

* set globalObject in webpack output config ([ba20425](https://github.com/narratorai/the-sequel/commit/ba20425bc9438667cfc819ced802927022ff6b99))

## [2.3.1](https://github.com/narratorai/the-sequel/compare/v2.3.0...v2.3.1) (2020-03-22)


### Bug Fixes

* remove monaco-editor-webpack-plugin + build workers ourselves ([025df01](https://github.com/narratorai/the-sequel/commit/025df01687c1d7d61c7ea19eb293fbf1358bdfa1))

# [2.3.0](https://github.com/narratorai/the-sequel/compare/v2.2.0...v2.3.0) (2020-03-17)


### Bug Fixes

* remove onChange support in SqlEditor ([8512ae2](https://github.com/narratorai/the-sequel/commit/8512ae21a296b199347e52186cfd65614b28f43b))


### Features

* add getValueRef to SqlEditorProps ([54b2553](https://github.com/narratorai/the-sequel/commit/54b2553f5ad072fea42e8931cb8d8d53bbe2795f))

# [2.2.0](https://github.com/narratorai/the-sequel/compare/v2.1.1...v2.2.0) (2020-03-17)


### Features

* add onChange support to SqlEditor ([0713af7](https://github.com/narratorai/the-sequel/commit/0713af7be4eaf980d10f2d52ae06438a039b3c91))

## [2.1.1](https://github.com/narratorai/the-sequel/compare/v2.1.0...v2.1.1) (2020-03-16)


### Bug Fixes

* support dark theme ([161bf7a](https://github.com/narratorai/the-sequel/commit/161bf7a9e015e2b5a41b5925ec5a44e460142d6f))

# [2.1.0](https://github.com/narratorai/the-sequel/compare/v2.0.0...v2.1.0) (2020-03-16)


### Features

* add theme prop to EditorWithTable and SqlEditor ([051edfa](https://github.com/narratorai/the-sequel/commit/051edfadc59c916d24745f09ead45661c4cf63c9))

# [2.0.0](https://github.com/narratorai/the-sequel/compare/v1.19.0...v2.0.0) (2020-03-15)


### Code Refactoring

* update BasicEditor to support changeOnBlurOnly prop ([87450b2](https://github.com/narratorai/the-sequel/commit/87450b23ef21a36c81ea4e8fa54a1cb3e07ada2a))


### Features

* add-nvmrc, and onChange to BasicEditor ([a18fe31](https://github.com/narratorai/the-sequel/commit/a18fe3111aa5dd5e05d0e25769e37239f50f0879))
* simplify BasicEditor and move old logic underneath SqlEditor ([9f02c30](https://github.com/narratorai/the-sequel/commit/9f02c303575217963cf8cdac6bd3cf0eeca85539))
* vs-dark and better onBlur registration in BasicEditor ([78da641](https://github.com/narratorai/the-sequel/commit/78da64193f189c5cddb90883b1c935254bdd0eb0))


### BREAKING CHANGES

* react-final-form input prop support has been removed

# [1.19.0](https://github.com/narratorai/the-sequel/compare/v1.18.2...v1.19.0) (2020-03-02)


### Features

* add language support for json and markdown ([d00a9dc](https://github.com/narratorai/the-sequel/commit/d00a9dc12091ee61772d53ffddcdf6e791459bc9))

## [1.18.2](https://github.com/narratorai/the-sequel/compare/v1.18.1...v1.18.2) (2020-02-14)


### Bug Fixes

* added default value to basic editor ([aba8154](https://github.com/narratorai/the-sequel/commit/aba8154db2101c4d72d1f371c18167ed416a1830))

## [1.18.1](https://github.com/narratorai/the-sequel/compare/v1.18.0...v1.18.1) (2020-01-03)


### Bug Fixes

* don't need to use lazy since we're not making chunks ([31fa610](https://github.com/narratorai/the-sequel/commit/31fa610040807385dc10da1ef07e9f4f4b58394b))

# [1.18.0](https://github.com/narratorai/the-sequel/compare/v1.17.0...v1.18.0) (2020-01-02)


### Features

* new BasicEditor to wrap Monaco editor ([2ec872e](https://github.com/narratorai/the-sequel/commit/2ec872e2b98bc2dd8073f212b559adc2833e95fb))

# [1.17.0](https://github.com/narratorai/the-sequel/compare/v1.16.3...v1.17.0) (2019-12-26)


### Bug Fixes

* add alias to 'all columns' columns ([3d622e5](https://github.com/narratorai/the-sequel/commit/3d622e5b0ab77fab11222f44a3b9827de95b7c7b))


### Features

* run selected query ([0959d2d](https://github.com/narratorai/the-sequel/commit/0959d2d1fe4e807f32f5b726734b0177ceab83d6))

## [1.16.3](https://github.com/narratorai/the-sequel/compare/v1.16.2...v1.16.3) (2019-12-18)


### Bug Fixes

* increased table row text size ([0c02012](https://github.com/narratorai/the-sequel/commit/0c02012372a3f520c3f1b5abfec48cb87df5b197))

## [1.16.2](https://github.com/narratorai/the-sequel/compare/v1.16.1...v1.16.2) (2019-12-18)


### Bug Fixes

* increase editor font size ([c1e5980](https://github.com/narratorai/the-sequel/commit/c1e5980b7ddebe189fc67342872dd2d05461e8e8))

## [1.16.1](https://github.com/narratorai/the-sequel/compare/v1.16.0...v1.16.1) (2019-12-18)


### Bug Fixes

* move 'all columns' to the table alias autocompletion ([990c8c2](https://github.com/narratorai/the-sequel/commit/990c8c23a0ea66d987d3e7fb8f6585e0e0ecc79b))

# [1.16.0](https://github.com/narratorai/the-sequel/compare/v1.15.0...v1.16.0) (2019-12-15)


### Features

* support saving and loading queries ([e4f8002](https://github.com/narratorai/the-sequel/commit/e4f800203e7aa0a36e0241512a1dfccf64324ed4))

# [1.15.0](https://github.com/narratorai/the-sequel/compare/v1.14.1...v1.15.0) (2019-12-12)


### Bug Fixes

* find all aliases within a table query, not just the first ([2b0aeee](https://github.com/narratorai/the-sequel/commit/2b0aeee3bb3c0b1c5ac28003400ae43261f36d46))


### Features

* highlight current query in the editor ([5adfadf](https://github.com/narratorai/the-sequel/commit/5adfadf83ad5300097d36af7cefb2b6c79486b18))
* only maintain table aliases under the current query ([1a2cb73](https://github.com/narratorai/the-sequel/commit/1a2cb7380f360732470b83892358a81c77b13065))

## [1.14.1](https://github.com/narratorai/the-sequel/compare/v1.14.0...v1.14.1) (2019-12-11)


### Bug Fixes

* update to get security fix from serialize-javascript ([2d224d6](https://github.com/narratorai/the-sequel/commit/2d224d604124d3ca404d2817e1182644c6ada998))

# [1.14.0](https://github.com/narratorai/the-sequel/compare/v1.13.0...v1.14.0) (2019-12-11)


### Features

* allow copying cells by editing the content ([9b067bb](https://github.com/narratorai/the-sequel/commit/9b067bb485e172d4aba7b09e70fc60699cebdfc4))

# [1.13.0](https://github.com/narratorai/the-sequel/compare/v1.12.2...v1.13.0) (2019-12-10)


### Features

* right click on a grid cell copies its value to the clipboard ([4df0cbe](https://github.com/narratorai/the-sequel/commit/4df0cbed5d7294b6f8b585eba14bda4be6b07114))

## [1.12.2](https://github.com/narratorai/the-sequel/compare/v1.12.1...v1.12.2) (2019-12-10)


### Bug Fixes

* removed the row numbers in the table ([b0ac546](https://github.com/narratorai/the-sequel/commit/b0ac546d0c2272ca52b57017805ea63894055ac2))

## [1.12.1](https://github.com/narratorai/the-sequel/compare/v1.12.0...v1.12.1) (2019-12-10)


### Bug Fixes

* made column ordering non-alphabetical for autocomplete ([806ce9c](https://github.com/narratorai/the-sequel/commit/806ce9c4c2068deea48044ea780211ffcf71c8df))

# [1.12.0](https://github.com/narratorai/the-sequel/compare/v1.11.1...v1.12.0) (2019-12-10)


### Features

* added SQL function autocomplete ([ab03236](https://github.com/narratorai/the-sequel/commit/ab032360545139ab101a6386c7b591df8417cd51))

## [1.11.1](https://github.com/narratorai/the-sequel/compare/v1.11.0...v1.11.1) (2019-12-06)


### Bug Fixes

* fixed autocomplete filter issue with aliased tables ([4a58948](https://github.com/narratorai/the-sequel/commit/4a58948591e30e6b2a420eb8228d629857542042))

# [1.11.0](https://github.com/narratorai/the-sequel/compare/v1.10.1...v1.11.0) (2019-12-06)


### Features

* table alias autocomplete ([5e6ea73](https://github.com/narratorai/the-sequel/commit/5e6ea730df2879c7e6d59dcb09078bac33a5a6c9))

## [1.10.1](https://github.com/narratorai/the-sequel/compare/v1.10.0...v1.10.1) (2019-12-04)


### Bug Fixes

* also export interfaces data table and warehouse search ([211e05a](https://github.com/narratorai/the-sequel/commit/211e05aea0376e116a7364ea371a3ccb91ec2ec7))

# [1.10.0](https://github.com/narratorai/the-sequel/compare/v1.9.2...v1.10.0) (2019-12-03)


### Features

* export the table and editor directly for Portal ([12374c5](https://github.com/narratorai/the-sequel/commit/12374c5781a5a8672d1fa5abaca449e8689ad89b))

## [1.9.2](https://github.com/narratorai/the-sequel/compare/v1.9.1...v1.9.2) (2019-12-03)


### Bug Fixes

* last commit should have been a fix, not a chore ([2476eae](https://github.com/narratorai/the-sequel/commit/2476eae38923af6b13bd9cdb56d1494199c3a837))

## [1.9.1](https://github.com/narratorai/the-sequel/compare/v1.9.0...v1.9.1) (2019-12-02)


### Bug Fixes

* open autocomplete on space too ([b5fdd9a](https://github.com/narratorai/the-sequel/commit/b5fdd9a1db1c20a59457340c1b59178fda8c71d1))

# [1.9.0](https://github.com/narratorai/the-sequel/compare/v1.8.3...v1.9.0) (2019-11-27)


### Features

* support for multiple queries in the editor ([972e87e](https://github.com/narratorai/the-sequel/commit/972e87e48b43032a997e504f6669d22070bff6af))

## [1.8.3](https://github.com/narratorai/the-sequel/compare/v1.8.2...v1.8.3) (2019-11-27)


### Bug Fixes

* export typescript definition files ([6c22050](https://github.com/narratorai/the-sequel/commit/6c220507879c5c0938b4ae60749198d14414d0e6))

## [1.8.2](https://github.com/narratorai/the-sequel/compare/v1.8.1...v1.8.2) (2019-11-27)


### Bug Fixes

* allow autocomplete service to be set at any time ([c251d1e](https://github.com/narratorai/the-sequel/commit/c251d1e2d2c320f92a2f0998101a4e166cb3653f))

## [1.8.1](https://github.com/narratorai/the-sequel/compare/v1.8.0...v1.8.1) (2019-11-26)


### Bug Fixes

* let autocomplete fire as we type the autocomplete word also ([175bc29](https://github.com/narratorai/the-sequel/commit/175bc290cd665b8e7d6d248b239e117007f2005a))

# [1.8.0](https://github.com/narratorai/the-sequel/compare/v1.7.1...v1.8.0) (2019-11-25)


### Features

* simple column autocomplete ([dc8e45a](https://github.com/narratorai/the-sequel/commit/dc8e45a444cba20f1812502934af10d1a05679ef))

## [1.7.1](https://github.com/narratorai/the-sequel/compare/v1.7.0...v1.7.1) (2019-11-22)


### Bug Fixes

* forgot to add the trigger character '.' for table autocomplete ([07785da](https://github.com/narratorai/the-sequel/commit/07785daa63105f18624cf8ac7972cdc18d25ff88))

# [1.7.0](https://github.com/narratorai/the-sequel/compare/v1.6.0...v1.7.0) (2019-11-22)


### Features

* added table autocomplete ([1f119fe](https://github.com/narratorai/the-sequel/commit/1f119fed67668616e618e1effc32019bd79a7e1b))

# [1.6.0](https://github.com/narratorai/the-sequel/compare/v1.5.0...v1.6.0) (2019-11-22)


### Bug Fixes

* dispose completion provider ([942800c](https://github.com/narratorai/the-sequel/commit/942800c0f2407a44e94f5fefd19438c7bac535a5))
* proper path for sql completion service ([d613f4f](https://github.com/narratorai/the-sequel/commit/d613f4f4b19a778bc9b755da927007af5bcbef1b))


### Features

* support schema autocomplete ([efd7d8d](https://github.com/narratorai/the-sequel/commit/efd7d8dc35b926ca585002e23b506982aaa0ce0a))
* very basic autocomplete for warehouse schemas ([79f49ae](https://github.com/narratorai/the-sequel/commit/79f49ae2944300214aa33903db9ebc2e0b205472))

# [1.5.0](https://github.com/narratorai/the-sequel/compare/v1.4.0...v1.5.0) (2019-11-20)


### Features

* added simple cmd-enter to run ([262a5ac](https://github.com/narratorai/the-sequel/commit/262a5ac6eb6fbd3ce56e4718811f1ca6d4a06011))

# [1.4.0](https://github.com/narratorai/the-sequel/compare/v1.3.0...v1.4.0) (2019-11-20)


### Features

* basic error handling ([48624cc](https://github.com/narratorai/the-sequel/commit/48624ccfa2f27019c0babc5f1015777120220927))

# [1.3.0](https://github.com/narratorai/the-sequel/compare/v1.2.0...v1.3.0) (2019-11-20)


### Features

* added a loading overlay ([ca944c1](https://github.com/narratorai/the-sequel/commit/ca944c1cd618baa6df9ede27c586dbb6047981b2))

# [1.2.0](https://github.com/narratorai/the-sequel/compare/v1.1.0...v1.2.0) (2019-11-18)


### Features

* support running real queries ([47e918b](https://github.com/narratorai/the-sequel/commit/47e918b45e7d442e6dbc36ca00176e82d90bd254))

# [1.1.0](https://github.com/narratorai/the-sequel/compare/v1.0.1...v1.1.0) (2019-11-18)


### Features

* added a table component using AgTable ([cf08d17](https://github.com/narratorai/the-sequel/commit/cf08d17a7b0d486cfdf86f1dae51f9383bcd1b07))

## [1.0.1](https://github.com/narratorai/the-sequel/compare/v1.0.0...v1.0.1) (2019-11-18)


### Bug Fixes

* **release:** test release ([2665eea](https://github.com/narratorai/the-sequel/commit/2665eea687e0cd0d16450e249da90fafdf1c9ecb))

# 1.0.0 (2019-11-18)


### Bug Fixes

* **release:** restore release action ([2939775](https://github.com/narratorai/the-sequel/commit/2939775976573c93e605f9eb1374342031d1b1dc))
* **release:** try to undo 1.0.0 fun ([b057a46](https://github.com/narratorai/the-sequel/commit/b057a46c5adde24a7376648ce92590005b19a868))
* test version number updates ([546f44d](https://github.com/narratorai/the-sequel/commit/546f44d44fcf8ccc82de54e88a7cb58cb2ce58c9))


### Features

* added a release flow ([4306689](https://github.com/narratorai/the-sequel/commit/430668934220d8edd3f3f86f9061af4c73e43bf4))
