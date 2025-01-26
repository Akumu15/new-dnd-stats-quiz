import React, { useState } from 'react';

const questions = {
  Strength: [
    { question: "How often do you engage in strength-based activities like lifting weights or carrying heavy objects?", options: ["Daily", "A few times a week", "Occasionally", "Rarely"], scores: [4, 3, 2, 1] },
    { question: "How would you describe your ability to climb a steep hill or stairs?", options: ["I can do it with ease", "It's challenging but manageable", "I get winded halfway through", "I avoid it whenever possible"], scores: [4, 3, 2, 1] },
    { question: "Can you perform push-ups or similar bodyweight exercises?", options: ["More than 20", "10-20", "5-10", "Fewer than 5"], scores: [4, 3, 2, 1] },
    { question: "When faced with a heavy object (e.g., furniture), how do you handle it?", options: ["I can lift and move it alone", "I need some help", "I need a lot of help", "I can't even attempt it"], scores: [4, 3, 2, 1] },
    { question: "How consistent are you with exercises targeting strength, like weightlifting?", options: ["Always consistent", "Mostly consistent", "Inconsistent", "Rarely, if ever"], scores: [4, 3, 2, 1] },
    { question: "How long can you maintain a plank position?", options: ["Over 2 minutes", "1-2 minutes", "30 seconds to 1 minute", "Less than 30 seconds"], scores: [4, 3, 2, 1] },
    { question: "Can you easily lift heavy groceries or carry multiple bags at once?", options: ["Yes, with no issue", "With some effort", "It's difficult", "Not at all"], scores: [4, 3, 2, 1] },
    { question: "How strong is your grip when shaking hands or gripping objects?", options: ["Very strong", "Strong", "Average", "Weak"], scores: [4, 3, 2, 1] },
    { question: "Can you perform activities like chopping wood or using tools requiring strength?", options: ["Yes, with ease", "With effort", "It's challenging", "Not at all"], scores: [4, 3, 2, 1] },
    { question: "If challenged to arm wrestle someone of similar size, how would you fare?", options: ["I'd win easily", "It would be a close match", "I'd probably lose", "I'd lose badly"], scores: [4, 3, 2, 1] }
  ],
  Dexterity: [
    { question: "How precise are your movements when performing delicate tasks like threading a needle?", options: ["Very precise", "Fairly precise", "Somewhat imprecise", "Very imprecise"], scores: [4, 3, 2, 1] },
    { question: "How quick are your reflexes, such as catching something before it falls?", options: ["I almost always catch it", "I catch it most of the time", "I rarely catch it", "I never catch it"], scores: [4, 3, 2, 1] },
    { question: "Can you balance on one foot for an extended period without wobbling?", options: ["Over 1 minute", "30 seconds to 1 minute", "10-30 seconds", "Less than 10 seconds"], scores: [4, 3, 2, 1] },
    { question: "How agile are you when navigating through obstacles or tight spaces?", options: ["Very agile", "Fairly agile", "Slightly clumsy", "Very clumsy"], scores: [4, 3, 2, 1] },
    { question: "How comfortable are you with activities requiring fine motor skills, like drawing or writing?", options: ["Very comfortable", "Somewhat comfortable", "Slightly uncomfortable", "Very uncomfortable"], scores: [4, 3, 2, 1] },
    { question: "Can you perform physical activities that require speed, like sprinting short distances?", options: ["I’m very fast", "I’m fairly fast", "I’m somewhat slow", "I’m very slow"], scores: [4, 3, 2, 1] },
    { question: "How good is your hand-eye coordination during activities like sports or gaming?", options: ["Excellent", "Good", "Fair", "Poor"], scores: [4, 3, 2, 1] },
    { question: "How well can you perform flexibility exercises or yoga poses?", options: ["Very well", "Fairly well", "Somewhat poorly", "Very poorly"], scores: [4, 3, 2, 1] },
    { question: "Can you execute movements requiring balance and timing, like dancing?", options: ["Very easily", "Fairly easily", "Somewhat difficultly", "Very difficultly"], scores: [4, 3, 2, 1] },
    { question: "If challenged to a game of reaction speed, how do you think you’d perform?", options: ["I’d win easily", "I’d do well", "I’d struggle", "I’d lose badly"], scores: [4, 3, 2, 1] }
  ],
  Constitution: [
    { question: "How would you rate your overall stamina and endurance for physical activities?", options: ["Excellent, I can go for hours", "Good, but I tire after a while", "Fair, I get tired quickly", "Poor, I avoid long physical tasks"], scores: [4, 3, 2, 1] },
    { question: "How often do you experience sickness, like colds or the flu?", options: ["Rarely, I almost never get sick", "Occasionally, but I recover quickly", "Often, but I manage to push through", "Very often, and it takes me a long time to recover"], scores: [4, 3, 2, 1] },
    { question: "Can you work long hours without feeling drained or exhausted?", options: ["Yes, I can keep going all day", "Most of the time, but I need breaks", "It’s difficult to sustain energy", "Not at all, I get tired quickly"], scores: [4, 3, 2, 1] },
    { question: "How quickly do you recover after physical exertion or a challenging workout?", options: ["Very quickly, within a few hours", "Within a day", "It takes me a couple of days", "I’m sore and tired for several days"], scores: [4, 3, 2, 1] },
    { question: "Can you walk or run for long distances without feeling fatigued?", options: ["Easily, I enjoy endurance activities", "With some effort, I manage", "It’s a struggle, but I can push through", "I can’t manage long distances at all"], scores: [4, 3, 2, 1] },
    { question: "How well do you tolerate extreme temperatures, like hot summers or cold winters?", options: ["Very well, they barely affect me", "Fairly well, though I notice them", "Not well, I feel uncomfortable quickly", "Very poorly, I avoid extreme conditions"], scores: [4, 3, 2, 1] },
    { question: "Do you maintain healthy habits like consistent sleep and nutrition?", options: ["Always, I prioritize health", "Most of the time, but I occasionally slip", "Sometimes, but I’m inconsistent", "Rarely, I neglect my health"], scores: [4, 3, 2, 1] },
    { question: "How strong is your immune system when surrounded by others who are sick?", options: ["I rarely catch anything", "I sometimes catch minor illnesses", "I often get sick but recover", "I almost always catch whatever is going around"], scores: [4, 3, 2, 1] },
    { question: "Can you handle multiple physically taxing days in a row without breaking down?", options: ["Yes, I thrive under pressure", "I manage, but it wears me out", "It’s tough, and I feel drained", "No, I need significant recovery time"], scores: [4, 3, 2, 1] },
    { question: "How often do you feel well-rested and full of energy?", options: ["Almost every day", "Most days, but not always", "Occasionally, but I often feel drained", "Rarely, I’m always tired"], scores: [4, 3, 2, 1] }
  ],
  Intelligence: [
    { question: "How often do you solve puzzles, riddles, or logic-based games?", options: ["Frequently, I enjoy the challenge", "Occasionally, when I have time", "Rarely, but I try sometimes", "Almost never, I’m not into them"], scores: [4, 3, 2, 1] },
    { question: "How well can you explain complex ideas to others?", options: ["Very well, I simplify them easily", "Fairly well, with some effort", "It’s difficult, but I can try", "Not well at all, I struggle"], scores: [4, 3, 2, 1] },
    { question: "Do you regularly engage in activities that challenge your brain, like learning a new language?", options: ["Frequently, I love learning new things", "Occasionally, when I feel motivated", "Rarely, but I’ve tried it before", "Almost never, it’s not my focus"], scores: [4, 3, 2, 1] },
    { question: "How good are you at remembering detailed information, like dates or names?", options: ["Excellent, I rarely forget", "Good, though I sometimes need reminders", "Fair, I forget things often", "Poor, I struggle to remember anything"], scores: [4, 3, 2, 1] },
    { question: "Can you easily analyze patterns or trends in information?", options: ["Very easily, I notice them quickly", "Fairly easily, but I take time", "It’s a challenge, but I manage", "Not at all, it’s difficult for me"], scores: [4, 3, 2, 1] },
    { question: "How often do you read books, articles, or educational content?", options: ["Daily, I love learning", "Weekly, when I find time", "Rarely, but I try sometimes", "Almost never, it’s not my habit"], scores: [4, 3, 2, 1] },
    { question: "How adept are you at planning and organizing your time effectively?", options: ["Extremely adept, I always plan ahead", "Fairly adept, but I occasionally procrastinate", "Not great, I often fall behind", "Poor, I’m disorganized"], scores: [4, 3, 2, 1] },
    { question: "Can you quickly adapt to new concepts or unfamiliar situations?", options: ["Very easily, I thrive in new challenges", "Fairly easily, but it takes effort", "Slowly, but I get there eventually", "Not at all, I struggle significantly"], scores: [4, 3, 2, 1] },
    { question: "How well do you perform in subjects requiring analytical skills, like math or science?", options: ["Very well, I excel in them", "Fairly well, I understand most concepts", "Not great, I find them challenging", "Poorly, they confuse me"], scores: [4, 3, 2, 1] },
    { question: "How naturally curious are you about exploring new ideas or topics?", options: ["Extremely curious, I seek out knowledge constantly", "Fairly curious, but I focus on specific areas", "Somewhat curious, but it depends on the topic", "Not curious, I stick to what I know"], scores: [4, 3, 2, 1] }
  ],
  Charisma: [
    { question: "How comfortable are you when meeting new people or in social situations?", options: ["Extremely comfortable, I thrive in social settings", "Mostly comfortable, but I get nervous sometimes", "Somewhat uncomfortable, but I can manage", "Very uncomfortable, I avoid social situations"], scores: [4, 3, 2, 1] },
    { question: "How effective are you at persuading others to see your point of view?", options: ["Very effective, I can often convince others", "Fairly effective, but it takes effort", "Occasionally effective, but I struggle", "Not effective at all, I rarely succeed"], scores: [4, 3, 2, 1] },
    { question: "Do you often make people laugh or feel at ease in your presence?", options: ["Frequently, I’m the life of the party", "Occasionally, I try to connect with others", "Rarely, but I try my best", "Almost never, I’m not naturally funny or warm"], scores: [4, 3, 2, 1] },
    { question: "How skilled are you at maintaining eye contact and confident body language?", options: ["Extremely skilled, I exude confidence", "Fairly skilled, but I slip sometimes", "Somewhat skilled, but I struggle often", "Not skilled at all, I avoid eye contact"], scores: [4, 3, 2, 1] },
    { question: "How much effort do you put into your appearance and personal grooming?", options: ["A lot, I prioritize looking my best", "A fair amount, I take care of myself", "Some effort, but I could do more", "Minimal effort, I don’t focus on it"], scores: [4, 3, 2, 1] },
    { question: "How well do you handle public speaking or presentations?", options: ["Extremely well, I enjoy speaking to groups", "Fairly well, but I get nervous", "Somewhat poorly, I try but struggle", "Very poorly, I avoid public speaking"], scores: [4, 3, 2, 1] },
    { question: "Do others often seek your advice or look to you for leadership?", options: ["Very often, I’m seen as a leader", "Fairly often, but only in certain situations", "Occasionally, but I’m not a go-to person", "Rarely, people don’t come to me for advice"], scores: [4, 3, 2, 1] },
    { question: "How naturally do you connect with people from different backgrounds?", options: ["Very naturally, I connect with almost anyone", "Fairly naturally, but it takes effort", "Somewhat awkwardly, but I try", "Not at all, I struggle to connect"], scores: [4, 3, 2, 1] },
    { question: "How often do people compliment your communication skills?", options: ["Very often, I get compliments regularly", "Occasionally, but it’s not frequent", "Rarely, but I’ve heard it before", "Almost never, it’s not my strength"], scores: [4, 3, 2, 1] },
    { question: "How comfortable are you in resolving conflicts or difficult conversations?", options: ["Very comfortable, I handle them skillfully", "Fairly comfortable, but it’s stressful", "Somewhat uncomfortable, but I try", "Very uncomfortable, I avoid conflict"], scores: [4, 3, 2, 1] }
  ],
  Wisdom: [
    { question: "How often do you trust your instincts when making decisions?", options: ["Always, I rely on my intuition", "Often, but I verify them first", "Sometimes, but I doubt myself", "Rarely, I don’t trust my instincts"], scores: [4, 3, 2, 1] },
    { question: "Do you often reflect on past experiences to guide your actions?", options: ["Always, I learn from every experience", "Often, but not always", "Occasionally, but I forget lessons sometimes", "Rarely, I don’t think about the past much"], scores: [4, 3, 2, 1] },
    { question: "How good are you at understanding others' emotions and perspectives?", options: ["Very good, I’m empathetic and insightful", "Fairly good, but I miss subtle cues", "Somewhat good, but I struggle often", "Not good at all, I find it hard to relate"], scores: [4, 3, 2, 1] },
    { question: "Do you practice mindfulness or activities that improve self-awareness?", options: ["Regularly, it’s a key part of my routine", "Occasionally, when I remember", "Rarely, but I’ve tried it", "Never, I don’t focus on mindfulness"], scores: [4, 3, 2, 1] },
    { question: "How well do you manage stress and stay emotionally balanced?", options: ["Very well, I remain calm and centered", "Fairly well, but I feel stress sometimes", "Somewhat poorly, I get overwhelmed easily", "Very poorly, I’m often stressed or unbalanced"], scores: [4, 3, 2, 1] },
    { question: "Do you regularly make thoughtful decisions based on long-term consequences?", options: ["Always, I think things through carefully", "Often, but I make mistakes sometimes", "Occasionally, but I’m impulsive at times", "Rarely, I focus on short-term outcomes"], scores: [4, 3, 2, 1] },
    { question: "How often do you listen more than you speak in conversations?", options: ["Very often, I’m a great listener", "Fairly often, but I talk a lot too", "Occasionally, but I dominate conversations", "Rarely, I struggle to let others talk"], scores: [4, 3, 2, 1] },
    { question: "Are you good at identifying potential risks in situations?", options: ["Very good, I often anticipate problems", "Fairly good, but I miss some details", "Somewhat good, but I overlook major risks", "Not good at all, I’m often blindsided"], scores: [4, 3, 2, 1] },
    { question: "How often do people come to you for guidance or advice?", options: ["Very often, I’m sought out regularly", "Occasionally, but not always", "Rarely, but it happens sometimes", "Almost never, I’m not a go-to person"], scores: [4, 3, 2, 1] },
    { question: "How often do you seek knowledge or spiritual growth?", options: ["Frequently, I’m always learning or reflecting", "Occasionally, when I feel motivated", "Rarely, but I’ve tried it before", "Almost never, it’s not my focus"], scores: [4, 3, 2, 1] },
  ],
};

const DnDStatsQuiz = () => {
  const [currentCategory, setCurrentCategory] = useState(Object.keys(questions)[0]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState({ Strength: 0, Dexterity: 0, Constitution: 0, Intelligence: 0, Charisma: 0, Wisdom: 0 });
  const [isCompleted, setIsCompleted] = useState(false);

  const handleAnswer = (score) => {
    setScores((prevScores) => ({
      ...prevScores,
      [currentCategory]: prevScores[currentCategory] + score,
    }));

    const isLastQuestion = currentQuestionIndex === questions[currentCategory].length - 1;
    const isLastCategory = Object.keys(questions).indexOf(currentCategory) === Object.keys(questions).length - 1;

    if (isLastQuestion) {
      if (isLastCategory) {
        setIsCompleted(true);
      } else {
        const nextCategory = Object.keys(questions)[Object.keys(questions).indexOf(currentCategory) + 1];
        setCurrentCategory(nextCategory);
        setCurrentQuestionIndex(0);
      }
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const calculateStats = (rawScore, maxScore) => {
    const abilityScore = Math.floor((rawScore / maxScore) * 20); // Scale to 1-20
    const modifier = Math.floor((abilityScore - 10) / 2); // Calculate modifier
    return { abilityScore, modifier };
  };
  
  const renderCharacterSheet = () => {
    const calculateStats = (rawScore, maxScore) => {
      const abilityScore = Math.floor((rawScore / maxScore) * 20);
      const modifier = Math.floor((abilityScore - 10) / 2);
      return { abilityScore, modifier };
    };
  
    const derivedStats = {
      HP: 10 + calculateStats(scores.Constitution, 40).modifier,
    };
  
    return (
      <div className="bg-yellow-100 p-6 rounded-xl border-4 border-gray-800 text-gray-900 max-w-4xl mx-auto">
        <h2 className="text-center text-3xl font-bold mb-4">D&D Character Sheet</h2>
  
        <div className="grid grid-cols-3 gap-4">
          {/* Ability Scores */}
          {Object.entries(scores).map(([stat, rawScore]) => {
            const { abilityScore, modifier } = calculateStats(rawScore, 40);
            return (
              <div
                key={stat}
                className="flex flex-col items-center justify-center bg-yellow-200 rounded-lg p-4 border-2 border-gray-700 shadow-md"
              >
                <h3 className="text-xl font-bold">{stat}</h3>
                <p className="text-2xl">{abilityScore}</p>
                <p className="text-lg">{modifier >= 0 ? `+${modifier}` : modifier}</p>
              </div>
            );
          })}
        </div>
  
        {/* Derived Stats */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold">Derived Stats</h3>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex flex-col items-center bg-yellow-200 rounded-lg p-4 border-2 border-gray-700 shadow-md">
              <h4 className="text-xl font-bold">Hit Points</h4>
              <p className="text-2xl">{derivedStats.HP}</p>
            </div>
            {/* Add Saving Throws or Other Derived Stats */}
          </div>
        </div>
      </div>
    );
  };
  

  return (
    <div className="quiz-container">
      {!isCompleted ? (
        <div className="question-section">
          <h2>{currentCategory}</h2>
          <p>{questions[currentCategory][currentQuestionIndex].question}</p>
          <div className="options">
            {questions[currentCategory][currentQuestionIndex].options.map((option, index) => (
              <button key={index} onClick={() => handleAnswer(questions[currentCategory][currentQuestionIndex].scores[index])}>
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : (
        renderCharacterSheet()
      )}
    </div>
  );
};

export default DnDStatsQuiz;