# [1.4.0](https://github.com/OleksandrZadvornyi/ternopil-light-bot/compare/v1.3.0...v1.4.0) (2026-02-04)


### Bug Fixes

* read location IDs from environment ([8cb6144](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/8cb614477fd55bf6495d091e19cbb69e04118a98))


### Features

* include last-updated time in schedule messages ([61c7213](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/61c7213ee37c08ec543ab05b029d897c182e5c0c))
* persist schedule in DB and broadcast updates ([c2d6c7a](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/c2d6c7adf74206907ad4e191d7ecd960fc4307e6))
* update bot commands ([88e56dc](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/88e56dc5589709a14b036adedad06a3fd441f72d))
* use Luxon for Kyiv timezone handling ([83b07cc](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/83b07cc2b4e4493669af64fbd10ddf9c9ad3ad64))

# [1.3.0](https://github.com/OleksandrZadvornyi/ternopil-light-bot/compare/v1.2.1...v1.3.0) (2026-02-03)


### Bug Fixes

* use env API_URL and update Referer header ([e732780](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/e7327801e5bf501a95292c11c1cfcfd77288901a))
* use Kyiv timezone when computing today ([0790e0f](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/0790e0f860be316c51bbbb7516adc2511e8815d8))


### Features

* improve API parsing, timezone and notifications ([7524bd0](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/7524bd090e7899c2c6b34fd5e1b28e4494b10194))

## [1.2.1](https://github.com/OleksandrZadvornyi/ternopil-light-bot/compare/v1.2.0...v1.2.1) (2026-02-02)


### Bug Fixes

* localize "all-day power on" message to Ukrainian ([329c997](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/329c9973e1e4c3dd1123d7395092ad3248bf982e))

# [1.2.0](https://github.com/OleksandrZadvornyi/ternopil-light-bot/compare/v1.1.0...v1.2.0) (2026-02-02)


### Features

* add custom keyboard and improve command handling ([4be3a70](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/4be3a701800382c516e44477a512b32830ed1812))

# [1.1.0](https://github.com/OleksandrZadvornyi/ternopil-light-bot/compare/v1.0.0...v1.1.0) (2026-02-02)


### Bug Fixes

* update /check command message to Ukrainian ([b1765a6](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/b1765a6cb918f11e1a2afb3c5fff20e5f772e4a9))


### Features

* switch persistence to MongoDB and add Express server ([bc92f06](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/bc92f06b97dee0e13722a9f41dc6b76f182bd950))

# 1.0.0 (2026-02-02)


### Features

* add API module for fetching power outage schedule ([ed88b84](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/ed88b847b1a9459b9e38fb1aedea0146fd550c3c))
* add Telegram bot for power outage schedule updates ([b90270e](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/b90270eaccb439ccf8e25b3b2c155a701cf533ab))
* persist Telegram bot subscribers to file ([ec43887](https://github.com/OleksandrZadvornyi/ternopil-light-bot/commit/ec438874751669a489e26161d9d515033dd6e9f7))
