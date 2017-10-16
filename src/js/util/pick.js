function pick(choices) {
    return choices.length <= 1
        ? choices[0]
        : choices[round(rand(0.0001,choices.length - 1))]
}
