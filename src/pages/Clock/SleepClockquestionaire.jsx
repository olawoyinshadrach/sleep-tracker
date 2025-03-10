


import React, { useState } from "react";

const SleepClockquestionaire = () => {
  const [answers, setAnswers] = useState({
    question1: "", // Sleep Quality
    question2: "", // Rested Feeling
    question3: "", // Time to Fall Asleep
    question4: "", // Night Wakeups
    question5: ""  // Caffeine Before Bed
  });
  const [currentStep, setCurrentStep] = useState(0); // Track the current question step
  const [isSubmitted, setIsSubmitted] = useState(false); // Track if the form is submitted
  const [suggestedBedtime, setSuggestedBedtime] = useState("");
  const [recommendedSleepHours, setRecommendedSleepHours] = useState(8);

  // Update answers for questionnaire
  const updateAnswer = (question, value) => {
    setAnswers({
      ...answers,
      [question]: value
    });
  };

  // Calculate suggested bedtime based on questionnaire answers
  const calculateSuggestedBedtime = () => {
    let recommendedBedtime = 12; // default starting point for bedtime
    let suggestedSleep = 8; // default sleep need

    // Adjust bedtime based on answers
    if (answers.question1 === "Very Bad" || answers.question1 === "Bad") {
      recommendedBedtime -= 2;
      suggestedSleep += 1; // Increase sleep time for poor sleep quality
    }

    if (answers.question2 === "Very Bad" || answers.question2 === "Bad") {
      recommendedBedtime -= 2;
      suggestedSleep += 1; // Increase sleep time for poor rested feeling
    }

    if (answers.question3 === "More than 25 min") {
      recommendedBedtime -= 1;
      suggestedSleep -= 0.5; // Slightly reduce sleep for longer time to fall asleep
    }

    if (answers.question4 === "3-4 times" || answers.question4 === "5+ times") {
      recommendedBedtime -= 1;
      suggestedSleep += 0.5; // Add more sleep for more night wakeups
    }

    if (answers.question5 === "Yes") {
      recommendedBedtime -= 1;
      suggestedSleep -= 0.5; // Reduce sleep time if caffeine is consumed before bed
    }

    // Keep sleep duration within a healthy range (6 to 10 hours)
    suggestedSleep = Math.max(6, Math.min(10, suggestedSleep));
    setRecommendedSleepHours(suggestedSleep);

    // Convert the suggested bedtime into a 24-hour time format
    const bedtimeHour = (recommendedBedtime + 24) % 24;
    const formattedTime = `${String(bedtimeHour).padStart(2, '0')}:00`;

    setSuggestedBedtime(formattedTime);
    setIsSubmitted(true); // Mark as submitted
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateSuggestedBedtime();
    }
  };

  const handleBack = () => {
    if (currentStep > 0 && !isSubmitted) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRedo = () => {
    setAnswers({
      question1: "",
      question2: "",
      question3: "",
      question4: "",
      question5: ""
    });
    setCurrentStep(0);
    setIsSubmitted(false);
    setSuggestedBedtime("");
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Answer these questions:</h2>

      {/* Display question steps */}
      {currentStep === 0 && (
        <div>
          <p>How would you rate your overall sleep quality?</p>
          <div className="flex flex-wrap gap-4">
            {["Very Bad", "Bad", "Neutral", "Good", "Excellent"].map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name="question1"
                  value={option}
                  onChange={(e) => updateAnswer("question1", e.target.value)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <p>How rested do you feel upon waking up?</p>
          <div className="flex flex-wrap gap-4">
            {["Very Bad", "Bad", "Neutral", "Good", "Excellent"].map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name="question2"
                  value={option}
                  onChange={(e) => updateAnswer("question2", e.target.value)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <p>How long do you take to fall asleep?</p>
          <div className="flex flex-wrap gap-4">
            {["5 min", "10 min", "15 min", "20 min", "More than 25 min"].map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name="question3"
                  value={option}
                  onChange={(e) => updateAnswer("question3", e.target.value)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div>
          <p>How many times do you wake up during the night?</p>
          <div className="flex flex-wrap gap-4">
            {["Not at all", "1-2 times", "3-4 times", "5+ times", "Don’t know"].map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name="question4"
                  value={option}
                  onChange={(e) => updateAnswer("question4", e.target.value)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div>
          <p>Do you consume caffeine before bed?</p>
          <div className="flex flex-wrap gap-4">
            {["Yes", "No"].map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name="question5"
                  value={option}
                  onChange={(e) => updateAnswer("question5", e.target.value)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={handleBack}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mr-2"
          disabled={currentStep === 0 || isSubmitted}
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          {currentStep === 4 ? "Submit" : "Next"}
        </button>
      </div>

      {isSubmitted && (
        <div className="mt-4">
          <h3 className="text-lg font-bold">Summary of Your Answers:</h3>
          <ul className="list-disc pl-5">
            <li><strong>Sleep Quality:</strong> {answers.question1}</li>
            <li><strong>Rested Feeling:</strong> {answers.question2}</li>
            <li><strong>Time to Fall Asleep:</strong> {answers.question3}</li>
            <li><strong>Night Wakeups:</strong> {answers.question4}</li>
            <li><strong>Caffeine Before Bed:</strong> {answers.question5}</li>
          </ul>

          {/* Suggested Bedtime */}
          {suggestedBedtime && (
            <p className="mt-4">
              <strong>Your suggested bedtime:</strong> {suggestedBedtime}
            </p>
          )}

          {/* Recommended Sleep Duration */}
          {recommendedSleepHours && (
            <p className="mt-2">
              <strong>Your recommended sleep duration:</strong> {recommendedSleepHours} hours
            </p>
          )}

          <button
            onClick={handleRedo}
            className="bg-yellow-500 text-white px-4 py-2 rounded mt-4 hover:bg-yellow-600"
          >
            Redo
          </button>
        </div>
      )}
    </div>
  );
};

export default SleepClockquestionaire;