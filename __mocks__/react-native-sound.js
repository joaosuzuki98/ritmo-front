class Sound {
    static MAIN_BUNDLE = 'MainBundle'

    constructor(_fileName, _basePath, onLoad) {
        if (onLoad) Promise.resolve().then(() => onLoad(null))
    }

    static setCategory() {}

    setNumberOfLoops() {}

    setVolume() {}

    play() {}

    stop() {}

    release() {}
}

module.exports = Sound
