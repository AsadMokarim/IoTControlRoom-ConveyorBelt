(function () {
    "use strict";

    const averageTemperatureElement =
        document.getElementById("average-temperature");

    const maximumTemperatureElement =
        document.getElementById("maximum-temperature");

    const vibrationElement =
        document.getElementById("rms-vibration");

    const activeAlertsElement =
        document.getElementById("active-alerts");

    const scoreElement =
        document.getElementById("health-score");

    const scoreRingElement =
        document.getElementById("health-score-ring");

    const scoreLabelElement =
        document.getElementById("health-score-label");

    if (
        !averageTemperatureElement ||
        !maximumTemperatureElement ||
        !vibrationElement ||
        !activeAlertsElement ||
        !scoreElement ||
        !scoreRingElement ||
        !scoreLabelElement
    ) {
        return;
    }

    function getNumber(element) {
        const value = parseFloat(
            element.textContent.replace(/[^0-9.-]/g, "")
        );

        return Number.isFinite(value) ? value : null;
    }

    function calculateHealthScore() {
        const averageTemperature = getNumber(
            averageTemperatureElement
        );

        const maximumTemperature = getNumber(
            maximumTemperatureElement
        );

        const vibration = getNumber(vibrationElement);

        const activeAlerts = getNumber(activeAlertsElement);

        /*
         * Wait until dashboard.js has populated the values.
         */
        if (
            averageTemperature === null ||
            maximumTemperature === null ||
            vibration === null ||
            activeAlerts === null
        ) {
            scoreElement.textContent = "--";
            scoreLabelElement.textContent = "Waiting for telemetry";
            scoreRingElement.style.setProperty("--health-score", "0%");
            return;
        }

        let score = 100;

        /*
         * Temperature penalties
         */
        if (averageTemperature > 50) {
            score -= (averageTemperature - 50) * 0.5;
        }

        if (maximumTemperature > 70) {
            score -= (maximumTemperature - 70) * 0.7;
        }

        /*
         * Vibration penalty
         */
        if (vibration > 3) {
            score -= (vibration - 3) * 5;
        }

        /*
         * Alert penalty
         */
        score -= activeAlerts * 10;

        score = Math.round(Math.max(0, Math.min(100, score)));

        updateHealthScore(score);
    }

    function updateHealthScore(score) {
        scoreElement.textContent = score;
        scoreRingElement.style.setProperty(
            "--health-score",
            `${score}%`
        );

        if (score >= 80) {
            scoreLabelElement.textContent = "Excellent condition";
            setScoreColors("#22c55e", "#38bdf8");
        } else if (score >= 60) {
            scoreLabelElement.textContent = "Requires attention";
            setScoreColors("#f59e0b", "#facc15");
        } else {
            scoreLabelElement.textContent = "Critical condition";
            setScoreColors("#ef4444", "#f97316");
        }
    }

    function setScoreColors(primaryColor, secondaryColor) {
        const score = getNumber(scoreElement) || 0;

        scoreRingElement.style.background = `
            radial-gradient(
                circle at center,
                #0f172a 59%,
                transparent 60%
            ),
            conic-gradient(
                ${primaryColor} 0%,
                ${secondaryColor} ${score}%,
                rgba(148, 163, 184, 0.18) ${score}%,
                rgba(148, 163, 184, 0.18) 100%
            )
        `;
    }

    /*
     * Run repeatedly so the score reflects values updated by
     * dashboard.js without modifying that file.
     */
    calculateHealthScore();
    setInterval(calculateHealthScore, 1000);
})();
