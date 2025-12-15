const quizFiles = [
  "java-basics",
  "java-intermediate",
  "java-hard-p1",
  "java-hard-p2"
];

async function fetchQuizMeta(filename) {
  const res = await fetch(`/api/activity/json/${filename}`);
  if (!res.ok) return null;
  return await res.json();
}

async function renderJavaQuizzes() {
  const quizList = document.getElementById('javaQuizList');
  quizList.innerHTML = '';
  for (const file of quizFiles) {
    const quiz = await fetchQuizMeta(file);
    if (!quiz) continue;
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="quiz-title">${quiz.title || 'Untitled Quiz'}</div>
      <div class="quiz-desc">${quiz.description || ''}</div>
      <div class="quiz-meta">
        <span>${quiz.multipleChoice?.length || 0} MCQ</span>
        <span>${quiz.trueFalse?.length || 0} True/False</span>
      </div>
      <button class="start-btn" onclick="startQuiz('${file}')">Start Quiz</button>
    `;
    quizList.appendChild(card);
  }
}

function startQuiz(filename) {
  window.location.href = `quiz_take.html?quiz=${filename}`;
}

document.addEventListener('DOMContentLoaded', renderJavaQuizzes);