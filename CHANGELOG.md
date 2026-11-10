# Changelog

## [2.0.0](https://github.com/joaosuzuki98/ritmo-front/compare/v1.2.0...v2.0.0) (2026-11-10)


### ⚠ BREAKING CHANGES

* Local authentication and session restoration now require server auth. The v14 migration permanently removes local password fields. Existing local records are not remapped to server user IDs.

### Features

* add adaptive habit schedule coaching ([35376ef](https://github.com/joaosuzuki98/ritmo-front/commit/35376efbc6ac7918166dc62159d08254d172b00f))
* add AI habit coaching chat ([713cc53](https://github.com/joaosuzuki98/ritmo-front/commit/713cc53f40fa2364630dbf5831a699c47406b603))
* add button to clear chat ([c768b52](https://github.com/joaosuzuki98/ritmo-front/commit/c768b52f741fedb2259a30a014bfd1ed2b22650d))
* Add daily app access and focus flow ([2481675](https://github.com/joaosuzuki98/ritmo-front/commit/2481675d6ebf902ad1ff6a626d3fc857856619d5))
* add functions to more actions ([e517267](https://github.com/joaosuzuki98/ritmo-front/commit/e51726791a01c94373dc9c0c7b022fbe9ae6e3bf))
* Add habit coaching and notification settings ([d72c20f](https://github.com/joaosuzuki98/ritmo-front/commit/d72c20f0089071f838c24e64dac53eb4d9bc99dd))
* add habit time pickers ([4001678](https://github.com/joaosuzuki98/ritmo-front/commit/400167858af31a45485dd4c156b9faa91cbb3985))
* add mascot icons to notifications ([e5e688b](https://github.com/joaosuzuki98/ritmo-front/commit/e5e688bb9ea7f77fd8081a4f644361cf43f01f7f))
* add Portuguese localization settings ([7b9d8bc](https://github.com/joaosuzuki98/ritmo-front/commit/7b9d8bc16800626dca3bdba805ded61bc3f910d7))
* add safespace to the ask the stars chat ([24858c3](https://github.com/joaosuzuki98/ritmo-front/commit/24858c3fb88992cf61f77d9f8c699da8bd416661))
* Add server authentication and data sync ([5084285](https://github.com/joaosuzuki98/ritmo-front/commit/508428555b334ed42d8bdae9f58962d8d42f50b5))
* add settings and local notifications ([c090912](https://github.com/joaosuzuki98/ritmo-front/commit/c0909121bbc2c3bb83c98ff918e966a00e8b75b3))
* add shop to drawer menu ([5bbe2bc](https://github.com/joaosuzuki98/ritmo-front/commit/5bbe2bc90777fa1be5c117efcf38625ebbb2b06b))
* add signup password visibility toggle ([0aeb9d1](https://github.com/joaosuzuki98/ritmo-front/commit/0aeb9d1172b8f8d32316a91852593f40263616b3))
* add start-your-day focus selection ([9800971](https://github.com/joaosuzuki98/ritmo-front/commit/9800971ec62e2b53fb102f48048ee47913e4bbfc))
* add weekly habit load notifications ([8d6a6e9](https://github.com/joaosuzuki98/ritmo-front/commit/8d6a6e9306156c483e803ba9b7dc25c7ffa87d3e))
* add weekly habit load recommendations ([1ad5e69](https://github.com/joaosuzuki98/ritmo-front/commit/1ad5e69bc518a2c0626cbc80d6f5f52f8c1d0b0d))
* animate Ask the Stars message ([4c80e42](https://github.com/joaosuzuki98/ritmo-front/commit/4c80e429ab184377247767c1a7ebbcdac01fdc7e))
* **habits:** improve toolbar and requirement pickers ([3b48c75](https://github.com/joaosuzuki98/ritmo-front/commit/3b48c75aa7f7383a2f83c3842933e1756d2e8a94))
* improve Ask the Stars experience ([f871859](https://github.com/joaosuzuki98/ritmo-front/commit/f871859fd683377532fc32087e03b04f4c78acb1))
* improve habit details modal ([f79cdb2](https://github.com/joaosuzuki98/ritmo-front/commit/f79cdb25b98b521f18b5286bbb173a9908417258))
* improve habit modal controls ([f16da07](https://github.com/joaosuzuki98/ritmo-front/commit/f16da079496cb9f356f3459017d2a8927687789c))
* load API URLs from environment ([f1c0492](https://github.com/joaosuzuki98/ritmo-front/commit/f1c0492e05540d4f8e594bfb75d691f140aa93f8))
* make focus flag list scroll after three rows ([7159dd3](https://github.com/joaosuzuki98/ritmo-front/commit/7159dd36bfc0ebd51546a61aa3abefd584d0b043))
* move authentication to the server ([aad7828](https://github.com/joaosuzuki98/ritmo-front/commit/aad7828ae21e517492208b1dfc579421d6c2fcc2))
* notify users about low-success habits ([2907953](https://github.com/joaosuzuki98/ritmo-front/commit/2907953e76ccbe159362e6a514592b57c69f3d6c))
* polish weekly habit analysis presentation ([034bc10](https://github.com/joaosuzuki98/ritmo-front/commit/034bc104b806f6b7b70622faa82a0418dc4d69c5))
* refine Ask the Stars analysis flow ([55652ae](https://github.com/joaosuzuki98/ritmo-front/commit/55652ae7d4e4277d8d9638c24306d500ebed35cd))
* refresh drawer navigation options ([478d562](https://github.com/joaosuzuki98/ritmo-front/commit/478d562b38677a7667dd3cc714bd9e23032aab05))
* remove analysis loading spinner ([7eecef1](https://github.com/joaosuzuki98/ritmo-front/commit/7eecef1887ed7e19b38114593a167e44e5b00ee0))
* save daily focus on continue ([8077ee1](https://github.com/joaosuzuki98/ritmo-front/commit/8077ee1ccaae1579bda7dbcfea78c1c127d628dd))
* show all habits in category heat map ([3ba7d82](https://github.com/joaosuzuki98/ritmo-front/commit/3ba7d82c6b2bf991e08d2260451575232da95c7a))
* show daily start screen when habits exist ([c2dc44d](https://github.com/joaosuzuki98/ritmo-front/commit/c2dc44df0a689120d04672fc1a27ff66a0b8c320))
* show login days in top bar ([b6a78c5](https://github.com/joaosuzuki98/ritmo-front/commit/b6a78c59ca8730f94a6349672c8b198d030a0c74))
* show tree markers for conditional habits ([2045259](https://github.com/joaosuzuki98/ritmo-front/commit/2045259886aeecbb426598bf634f1cc04d12b190))
* show user mascot in profile navigation ([fa61a4a](https://github.com/joaosuzuki98/ritmo-front/commit/fa61a4a4fede7b40378998f20ecbe3fcff241799))
* standardize schedule and reminder modals ([3cad7c3](https://github.com/joaosuzuki98/ritmo-front/commit/3cad7c3ee85706b433dcac28b9d619781b55aa7b))
* tailor habit analysis messages by success rate ([c15b81a](https://github.com/joaosuzuki98/ritmo-front/commit/c15b81a8819ff16d5d765a2fb58ff865bae551a7))
* update bottom bar icons ([f40a87d](https://github.com/joaosuzuki98/ritmo-front/commit/f40a87dd2f80756b06d9e2dfce34cc7fba621429))
* use native pickers for progress fields ([6987a9a](https://github.com/joaosuzuki98/ritmo-front/commit/6987a9a0c288cdbfd0e481661d27d6b8ab07a57b))
* wire authenticated database sync ([d9ff868](https://github.com/joaosuzuki98/ritmo-front/commit/d9ff868dc639e2fb988770d168835933ebfa6266))


### Bug Fixes

* align habit toolbar with cards ([e3744d0](https://github.com/joaosuzuki98/ritmo-front/commit/e3744d069d35ff3f077dffb8b57aca26ddc33f96))
* avoid recommending occupied habit slots ([0927db0](https://github.com/joaosuzuki98/ritmo-front/commit/0927db0f0cc91612e5444f92778aed6e0ad114c0))
* clarify low-success notification settings ([539a799](https://github.com/joaosuzuki98/ritmo-front/commit/539a799eea36ed7e6c032898cbc7611c9b350ad6))
* fix erros with statistics ([2ccc6fa](https://github.com/joaosuzuki98/ritmo-front/commit/2ccc6fab36f7e9350282cb8cc1619dc35a628d03))
* match notification option text size ([91aee21](https://github.com/joaosuzuki98/ritmo-front/commit/91aee21920a7cc96362136e3da00734ff2e406e7))
* migrate pending habit analysis column ([a496379](https://github.com/joaosuzuki98/ritmo-front/commit/a4963796fa4d59f81a3eb4e3aa0b437dc9f2009a))
* navigate after closing the drawer ([e6fe399](https://github.com/joaosuzuki98/ritmo-front/commit/e6fe399632d1f69e86631536fcd008b09d700a0f))
* prevent schedule actions from covering suggestions ([163f151](https://github.com/joaosuzuki98/ritmo-front/commit/163f1510cf909b93703eeaed879177eaf6eb6a4d))
* refresh habit cards after schedule changes ([8f44260](https://github.com/joaosuzuki98/ritmo-front/commit/8f44260872d54b920d04e64da5b6309e072701e3))
* remove double-tap hint popup ([7be28e0](https://github.com/joaosuzuki98/ritmo-front/commit/7be28e0124aa1a7e7d0baee3052b702cdc27616a))
* translate notification setting labels ([f2de213](https://github.com/joaosuzuki98/ritmo-front/commit/f2de21320c8e7de60ce9bb064ff2c0089c75fb38))
* translate progress status prompt ([8d65e76](https://github.com/joaosuzuki98/ritmo-front/commit/8d65e76fc152e464bfe79b9af38a5cf6c14254ec))
* use server reason ids for completions ([2af76b5](https://github.com/joaosuzuki98/ritmo-front/commit/2af76b5e8d0d5ab0c866d61700bb6c90533211bc))

## [1.2.0](https://github.com/joaosuzuki98/ritmo-front/compare/v1.1.0...v1.2.0) (2026-10-28)


### Features

* add bottom sheet layout component ([8797962](https://github.com/joaosuzuki98/ritmo-front/commit/879796214ca707689f08d962e1f89971b38a9154))
* add password strength feedback ([e08b78b](https://github.com/joaosuzuki98/ritmo-front/commit/e08b78b049de1c4e18330b60ad901b8c2236d56b))
* animate background stars independently ([d7b9661](https://github.com/joaosuzuki98/ritmo-front/commit/d7b96610edd9afc73b71c9aec9e92571bd6a4c13))
* generate specs from GitHub issues ([dc21f4b](https://github.com/joaosuzuki98/ritmo-front/commit/dc21f4b0923528f24b51bd91b04892fcc3a99fe5))
* navigate onboarding from progress indicators ([0442cb7](https://github.com/joaosuzuki98/ritmo-front/commit/0442cb794fffa015e616c6feab2fe390ebeb1d12))
* Refresh onboarding and app interactions ([0c68ecf](https://github.com/joaosuzuki98/ritmo-front/commit/0c68ecfe77d232b1ad534aa45c71f8c6d5a7a5ff))
* refresh onboarding flow and visuals ([8f77332](https://github.com/joaosuzuki98/ritmo-front/commit/8f7733230ab79fe99edffddf5a8e9ce1accbc218))


### Bug Fixes

* add rapid blinks to onboarding mascot ([c6c9296](https://github.com/joaosuzuki98/ritmo-front/commit/c6c92963f25050878b2019a6ace57bf0a9c58b47))
* align onboarding descriptions ([136dd86](https://github.com/joaosuzuki98/ritmo-front/commit/136dd868b76429b24887ed9447ff2e879d1185bc))
* keep auth inputs clear of the keyboard ([bb6f416](https://github.com/joaosuzuki98/ritmo-front/commit/bb6f416e435766f29666c3c0cb92176e406349f2))
* keep inputs and mascot visible with keyboard ([718cf2e](https://github.com/joaosuzuki98/ritmo-front/commit/718cf2e1cb41fafc8b107b768443dc114ab41426))
* make onboarding mascot transition seamless ([648b2b9](https://github.com/joaosuzuki98/ritmo-front/commit/648b2b972b706ddf2408f768dc09bebdc61c066f))
* preserve auth keyboard interactions ([9b17143](https://github.com/joaosuzuki98/ritmo-front/commit/9b1714321012ea9063748661489548e22f9bbbb3))
* prevent onboarding delays when dismissing the keyboard ([3883ac0](https://github.com/joaosuzuki98/ritmo-front/commit/3883ac088108ef7b78a0035e37a48d3418f9446a))
* stop shifting auth forms for keyboard ([0903ad2](https://github.com/joaosuzuki98/ritmo-front/commit/0903ad2e8ad6c136f4f827a23a750b85097d3d42))
* translate auth screens to English ([873b2eb](https://github.com/joaosuzuki98/ritmo-front/commit/873b2ebd92d9b321500fc092b132e0e8fa1200e1))
* use English registration action label ([c88dd19](https://github.com/joaosuzuki98/ritmo-front/commit/c88dd190f7f77aae3f06e4701541921fa292c2ec))
* use English throughout onboarding ([bda8b8b](https://github.com/joaosuzuki98/ritmo-front/commit/bda8b8be3802b4ab557a263ec28dcad264cf7d92))

## [1.1.0](https://github.com/joaosuzuki98/ritmo-front/compare/v1.0.1...v1.1.0) (2026-10-11)


### Features

* add native Android splash screen ([178b644](https://github.com/joaosuzuki98/ritmo-front/commit/178b644cbaa33a3f56d89f00f054b1de4b5e53b0))
* add Ritmo launcher icons for Android ([ea297e2](https://github.com/joaosuzuki98/ritmo-front/commit/ea297e227e7031e19fc2a3a33c5f937b50b1e02e))
* refresh Android launcher icons and add themed icon support ([7abc288](https://github.com/joaosuzuki98/ritmo-front/commit/7abc288005e8b298038a35667a8e9c13c0cc5e4f))


### Bug Fixes

* increase splash screen logo size ([599cb32](https://github.com/joaosuzuki98/ritmo-front/commit/599cb323c2e32d742b8a7c2ad8805606fa1c6f3c))
* resolve ESLint warnings ([c59a470](https://github.com/joaosuzuki98/ritmo-front/commit/c59a470df8d50516568cd4d6bb4ac3bb822bc4b7))
* set app display name to Ritmo App ([4c445a6](https://github.com/joaosuzuki98/ritmo-front/commit/4c445a604e642a564083d3d5f8af8205d86777e2))
* skip legacy Android SDK tools package ([a0227d6](https://github.com/joaosuzuki98/ritmo-front/commit/a0227d6205c66215b921dafdb65e10e2925b0e5f))
* Skip legacy Android SDK tools package ([f8f333f](https://github.com/joaosuzuki98/ritmo-front/commit/f8f333fe759e53570fad4d648ce62abeea0aacc3))
* use Android SDK platform android-37.0 ([36a4740](https://github.com/joaosuzuki98/ritmo-front/commit/36a47404f36ea71cecf5d6c5aeb68550e2ce7660))

## [1.0.1](https://github.com/joaosuzuki98/ritmo-front/compare/v1.0.0...v1.0.1) (2026-10-09)


### Bug Fixes

* Correct conditional streaks and restrict habit completion to today ([4c7e5f1](https://github.com/joaosuzuki98/ritmo-front/commit/4c7e5f1735781dcbc1dc32cb54c904e9207ced88))
* ignore ineligible days in conditional habit streaks ([0f15ad2](https://github.com/joaosuzuki98/ritmo-front/commit/0f15ad26ec8e24dcf39b06c2d68c75f81b40dc8c))
* prevent cards from jumping during reorder ([c19a2f5](https://github.com/joaosuzuki98/ritmo-front/commit/c19a2f5ad15a3d1c0eeccdd99a0ddd69ac4a3d81))
* prevent completing habits on other days ([340daa9](https://github.com/joaosuzuki98/ritmo-front/commit/340daa986d4da4854085794dcb3141df36c22997))
* prevent jumps while reordering habits ([2651390](https://github.com/joaosuzuki98/ritmo-front/commit/26513903604b9dd87e774979be9af3ebdfd70e4d))
* scope habit completion to the selected day instead of today ([52bbd4b](https://github.com/joaosuzuki98/ritmo-front/commit/52bbd4bd83e24deeb92e17e58889096ab173752e))
* stabilize habit card animations ([d3de07f](https://github.com/joaosuzuki98/ritmo-front/commit/d3de07f8f89ef1300eba727f71d6e204eebcee33))
* Stabilize Habit Card Reordering ([e216057](https://github.com/joaosuzuki98/ritmo-front/commit/e216057dc419453ee34e00e2ffd3f6fb492543ad))

## 1.0.0 (2026-09-29)


### Features

* Add authentication and rework screens ([8d7301f](https://github.com/joaosuzuki98/ritmo-front/commit/8d7301f651cab56dcdfb95070c477a78fc228d29))
* add authentication screens ([755b051](https://github.com/joaosuzuki98/ritmo-front/commit/755b0512afcaa38cdfd0a2b48c8ece71931eba3e))
* add conditional and chained habits ([aaa187f](https://github.com/joaosuzuki98/ritmo-front/commit/aaa187f8bf97f739bf4f449d720fa0458494435f))
* add custom todo categories ([8d666cd](https://github.com/joaosuzuki98/ritmo-front/commit/8d666cdb7a4112be312967c03fb45938b41bc7ea))
* add edit and delete options to schedule ([8376c6c](https://github.com/joaosuzuki98/ritmo-front/commit/8376c6ce306b3935462797a9f6c239bbd6727e0c))
* add event details to schedule forms ([778c7e4](https://github.com/joaosuzuki98/ritmo-front/commit/778c7e4c3729a679ece29c27d162128cc77fe4cd))
* add habit creation modal ([004ba78](https://github.com/joaosuzuki98/ritmo-front/commit/004ba78d13f53f985103230c0679f098d4e13145))
* add habit details modal ([5a38b34](https://github.com/joaosuzuki98/ritmo-front/commit/5a38b3413d9ea7b138109498fa8ef94bc6078919))
* add habit edit and delete actions ([d2e60a0](https://github.com/joaosuzuki98/ritmo-front/commit/d2e60a04a7feb6ba61256285694c242ac5253610))
* add habit goals to todo screen ([e02ece0](https://github.com/joaosuzuki98/ritmo-front/commit/e02ece00e6cbe513bf69651d14d54e00995a3299))
* add habit pause animation ([6bbd194](https://github.com/joaosuzuki98/ritmo-front/commit/6bbd1941bc56673f31f15d88680d9013dd3e02bf))
* Add habit screens ([afc025a](https://github.com/joaosuzuki98/ritmo-front/commit/afc025a76f5595ab27015b32c6094f141c32c4ca))
* add habits dashboard ([2ac2232](https://github.com/joaosuzuki98/ritmo-front/commit/2ac2232cb79fd8e15c443f5c41646613e12d4335))
* add local login and registration ([cd6987a](https://github.com/joaosuzuki98/ritmo-front/commit/cd6987aaee7f4357e282d2d3e50fe80e67cbd7ab))
* add mcp servers file ([8a7261e](https://github.com/joaosuzuki98/ritmo-front/commit/8a7261e8de547012cd566352485681aeabb87a89))
* add month and year picker to reminders ([f94b258](https://github.com/joaosuzuki98/ritmo-front/commit/f94b258c1b5b24d7cdbad8c0dd30869344f440f2))
* add nativewind and its dependencies ([c3022a1](https://github.com/joaosuzuki98/ritmo-front/commit/c3022a1171084f3667344c0b5a4be4df9bf6e1fc))
* add navigation drawer ([8672353](https://github.com/joaosuzuki98/ritmo-front/commit/86723535ad328c5185e89073d3f58600b109b3db))
* add onboarding background music ([374e41b](https://github.com/joaosuzuki98/ritmo-front/commit/374e41bf51df6e8fcba065925ab2e0a5d4f3be41))
* add onboarding screens ([3034297](https://github.com/joaosuzuki98/ritmo-front/commit/303429757382708ed0a3b423b50dfe24ee17ef30))
* add Quattrocento Sans onboarding font ([0fb96f1](https://github.com/joaosuzuki98/ritmo-front/commit/0fb96f1cf337b787babc74737871c40d7af98bd0))
* add reminders screen ([8ae1ab2](https://github.com/joaosuzuki98/ritmo-front/commit/8ae1ab2ab1a204738649a8a1bd40097b764187e0))
* Add reminders screen ([77a6879](https://github.com/joaosuzuki98/ritmo-front/commit/77a687906f59f959def1c617540516680ab8a9d4))
* add schedule item modal ([17c1bf4](https://github.com/joaosuzuki98/ritmo-front/commit/17c1bf4144dbf62e0d5e94c4681d0c86529a8f92))
* add schedule screen ([9a4ff45](https://github.com/joaosuzuki98/ritmo-front/commit/9a4ff45a510113846963d9f0e358b7f6b57d9eea))
* Add schedule screens ([c2a66e4](https://github.com/joaosuzuki98/ritmo-front/commit/c2a66e4790f99f295511f54fbc8ff24d65da8679))
* add speckit ([876fcbb](https://github.com/joaosuzuki98/ritmo-front/commit/876fcbb09e471bdcb04928d46a783dbf344bfc98))
* add todo screen ([f37b7d8](https://github.com/joaosuzuki98/ritmo-front/commit/f37b7d8c67a97896a0187f246ba2f3504c1af840))
* Add todo screen ([2e7f9d1](https://github.com/joaosuzuki98/ritmo-front/commit/2e7f9d10a460e16203af0b7179ae2b6e6c1e8ae0))
* add WatermelonDB offline sync ([e408b0e](https://github.com/joaosuzuki98/ritmo-front/commit/e408b0ef8b3906e2de108d056be40bdb396152c4))
* add welcome title to onboarding intro ([e2ea8fb](https://github.com/joaosuzuki98/ritmo-front/commit/e2ea8fbe8b33517818b82d026941bc3ab9207c93))
* automate schedule habit linking ([b212854](https://github.com/joaosuzuki98/ritmo-front/commit/b2128545446718093f5ac30681de17f6084e2bdd))
* choose existing habit categories ([c030a56](https://github.com/joaosuzuki98/ritmo-front/commit/c030a56619dc359bfdc1b1ba1bfe6f8109bf3893))
* complete chained habits automatically ([b6b4585](https://github.com/joaosuzuki98/ritmo-front/commit/b6b45857793218175032b82c7be6b70caf87f964))
* complete habits with double tap ([e3a25c1](https://github.com/joaosuzuki98/ritmo-front/commit/e3a25c174c0532a2b832b064f86b43b463364ffd))
* Enhance ui elements and fis s ([4bca00e](https://github.com/joaosuzuki98/ritmo-front/commit/4bca00e4850d4f0d5bda7f6208d49df1c1b4ff85))
* highlight current schedule hour ([02008bc](https://github.com/joaosuzuki98/ritmo-front/commit/02008bc18bc787bff409d47bab5270e16682eeb2))
* manage reminder events ([a0ccc1d](https://github.com/joaosuzuki98/ritmo-front/commit/a0ccc1df730b3bfbc5bee41a29ea0f2f18d8b835))
* persist event descriptions ([bfc1d89](https://github.com/joaosuzuki98/ritmo-front/commit/bfc1d89cbc4e557037947b85d52c1990f1a4cce0))
* persist schedule items in WatermelonDB ([adcfe5c](https://github.com/joaosuzuki98/ritmo-front/commit/adcfe5cb3376cb613f194aba1611917b270fa20a))
* persist todo tasks in WatermelonDB ([8575b48](https://github.com/joaosuzuki98/ritmo-front/commit/8575b4886a4a128b67ae3c080500473f613e8190))
* prevent schedule time conflicts ([a7798b4](https://github.com/joaosuzuki98/ritmo-front/commit/a7798b43b63a06052cbffe707528eac21b386caa))
* record daily habit progress ([2fec2a7](https://github.com/joaosuzuki98/ritmo-front/commit/2fec2a7e12185c7c2ae58c3ea40a6eee04b01774))
* record habit incompletion reasons ([fc14f87](https://github.com/joaosuzuki98/ritmo-front/commit/fc14f87a90598c3776244625fa84aa9d4151eb7c))
* redesign authentication screens ([6ec0c19](https://github.com/joaosuzuki98/ritmo-front/commit/6ec0c19d90150d81f4da61ec61fcc7d4e6b22ce7))
* redesign onboarding flow ([4644120](https://github.com/joaosuzuki98/ritmo-front/commit/46441203996dbcc4749c5c80be3a21eb1ae341b1))
* show scheduled events in daily timeline ([513f2c7](https://github.com/joaosuzuki98/ritmo-front/commit/513f2c75c70fb69b28d9bdd22ee3bb225388d3ab))
* show warning for partial habits ([c05c668](https://github.com/joaosuzuki98/ritmo-front/commit/c05c66820c92be65c37e983fe5fd9996a2927e24))
* support typed reminders ([b052cb6](https://github.com/joaosuzuki98/ritmo-front/commit/b052cb61cb37336d6024d4e00ebded0b66d87ff0))


### Bug Fixes

* add spacing below focus of the day ([f2ae14e](https://github.com/joaosuzuki98/ritmo-front/commit/f2ae14e0442b36151e0b20ab72b7e317d3d0625b))
* adjust drawer logout and profile ([645c27f](https://github.com/joaosuzuki98/ritmo-front/commit/645c27f788f7c98a996b40a3bf3ba36f29268a23))
* center no habits message ([639dc41](https://github.com/joaosuzuki98/ritmo-front/commit/639dc418104d2cc197e8d1b9b8a5c29af4c77929))
* constrain preferred habit time input ([c6aa3e6](https://github.com/joaosuzuki98/ritmo-front/commit/c6aa3e6b4de4c73fd28c7dd0a692bfc1bb084c2f))
* improve habit details layout ([0bdcb7d](https://github.com/joaosuzuki98/ritmo-front/commit/0bdcb7d16e6ba26b77be032543ee4ab63dfbd3c3))
* recalculate habit streaks from completion history ([d3c6ea8](https://github.com/joaosuzuki98/ritmo-front/commit/d3c6ea8a162c41c4b00a76e37216c879d77b40e7))
* refresh schedule and reminder views on edits ([3496ced](https://github.com/joaosuzuki98/ritmo-front/commit/3496ced4fc2368c499a28a678ad6242fde138aad))
* remove empty schedule notice ([7b2dbb4](https://github.com/joaosuzuki98/ritmo-front/commit/7b2dbb4d640dab0bb9c0f1e9497b337435c2b798))
* remove schedule modal subtitles ([66be175](https://github.com/joaosuzuki98/ritmo-front/commit/66be175fa8aba637072c876d22cbcc97ae585c3f))
* respect safe area in habit modals ([6480cc7](https://github.com/joaosuzuki98/ritmo-front/commit/6480cc73b7ac105f3fab58ce1f908a06862f5c16))
* separate schedule and reminders display ([bf5ba1b](https://github.com/joaosuzuki98/ritmo-front/commit/bf5ba1b23fb272efda50c505c0a380776232773e))
* show fallback for empty habit description ([7aebe53](https://github.com/joaosuzuki98/ritmo-front/commit/7aebe53949445203adccd8a1cc3addcd1dadb64d))
* style completed habits ([8af6e06](https://github.com/joaosuzuki98/ritmo-front/commit/8af6e0612571080839ade3895a37dd4a1cc09b57))
* support zod v4 namespace exports ([6bad5d5](https://github.com/joaosuzuki98/ritmo-front/commit/6bad5d59d476e82b91fd9c68b85e01344c80bf87))
* update todo completion reactively ([d1dad36](https://github.com/joaosuzuki98/ritmo-front/commit/d1dad36cc72a8009b0da8dca0fd2372c39f8c24b))


### Performance Improvements

* speed up local account creation ([3705597](https://github.com/joaosuzuki98/ritmo-front/commit/370559787dfaa73a955a359b8390ab51fb15ee2d))
