export const QUIZ_QUESTIONS = [
  {
    q: 'Which planet has the most moons in our Solar System?',
    opts: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
    ans: 1,
    explain: 'Saturn currently holds the record with 146 confirmed moons, surpassing Jupiter\'s 95.'
  },
  {
    q: 'What is the hottest planet in our Solar System?',
    opts: ['Mercury', 'Mars', 'Venus', 'Jupiter'],
    ans: 2,
    explain: 'Venus is the hottest at 465°C due to a runaway greenhouse effect, despite Mercury being closer to the Sun.'
  },
  {
    q: 'Which planet rotates on its side with a 98° axial tilt?',
    opts: ['Neptune', 'Saturn', 'Mars', 'Uranus'],
    ans: 3,
    explain: 'Uranus has an axial tilt of 98°, meaning it essentially rolls around the Sun on its side.'
  },
  {
    q: 'How long does sunlight take to reach Earth?',
    opts: ['2 minutes', '8 minutes 20 seconds', '1 hour', '24 hours'],
    ans: 1,
    explain: 'Light from the Sun travels 149.6 million km and takes about 8 minutes 20 seconds to reach Earth.'
  },
  {
    q: 'Which is the largest volcano in the Solar System?',
    opts: ['Mauna Kea', 'Olympus Mons', 'Maxwell Montes', 'Arsia Mons'],
    ans: 1,
    explain: 'Olympus Mons on Mars is 22 km tall and 600 km wide — the largest known volcano in the Solar System.'
  },
  {
    q: 'What are Saturn\'s rings primarily made of?',
    opts: ['Gas and dust', 'Iron and nickel', 'Ice and rock particles', 'Liquid hydrogen'],
    ans: 2,
    explain: 'Saturn\'s rings are composed of billions of ice and rock particles ranging in size from a grain of sand to a house.'
  },
  {
    q: 'Which spacecraft is the most distant human-made object?',
    opts: ['Voyager 2', 'New Horizons', 'Voyager 1', 'Pioneer 10'],
    ans: 2,
    explain: 'Voyager 1, launched in 1977, is now over 23 billion km from Earth in interstellar space.'
  },
  {
    q: 'Which of Jupiter\'s moons likely has a subsurface ocean?',
    opts: ['Io', 'Ganymede', 'Callisto', 'Europa'],
    ans: 3,
    explain: 'Europa is believed to have a vast liquid water ocean beneath its icy crust, making it a prime candidate for extraterrestrial life.'
  },
  {
    q: 'How long is a Neptunian year in Earth years?',
    opts: ['84 years', '29 years', '165 years', '248 years'],
    ans: 2,
    explain: 'Neptune takes approximately 164.8 Earth years to complete one orbit around the Sun. It only completed its first orbit since discovery in 2011.'
  },
  {
    q: 'Which planet is the least dense — less dense than water?',
    opts: ['Jupiter', 'Uranus', 'Neptune', 'Saturn'],
    ans: 3,
    explain: 'Saturn\'s density of 0.687 g/cm³ is less than water (1 g/cm³), meaning it would technically float in a large enough ocean.'
  },
];

export class QuizComponent {
  constructor(container) {
    this.container = container;
    this.questions = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 8);
    this.current = 0;
    this.score = 0;
    this.answered = false;
    this.render();
  }

  render() {
    if (this.current >= this.questions.length) {
      this.showResult();
      return;
    }
    const q = this.questions[this.current];
    const progress = ((this.current) / this.questions.length) * 100;

    this.container.innerHTML = `
      <div class="quiz-progress">
        <div class="quiz-progress-fill" style="width:${progress}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <span style="font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:0.3em;color:rgba(255,255,255,0.35);text-transform:uppercase">
          Question ${this.current + 1} of ${this.questions.length}
        </span>
        <span style="font-family:'Space Grotesk',sans-serif;font-size:13px;color:#00FFC6">
          Score: ${this.score}/${this.current}
        </span>
      </div>
      <p class="quiz-question">${q.q}</p>
      <div class="quiz-options" id="quiz-opts">
        ${q.opts.map((o, i) => `
          <button class="quiz-option" data-i="${i}" onclick="window._quizAnswer(${i})">${o}</button>
        `).join('')}
      </div>
      <div id="quiz-explain" style="display:none;margin-top:1.25rem;padding:1rem;background:rgba(0,229,255,0.05);border:1px solid rgba(0,229,255,0.15);border-radius:12px">
        <p style="font-size:13px;color:rgba(255,255,255,0.65);line-height:1.6"></p>
        <button onclick="window._quizNext()" style="margin-top:1rem;font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:0.25em;color:#02030A;background:linear-gradient(135deg,#00E5FF,#6A5CFF);border:none;border-radius:20px;padding:0.6rem 1.5rem;cursor:pointer;text-transform:uppercase;">
          ${this.current + 1 < this.questions.length ? 'Next Question →' : 'See Results →'}
        </button>
      </div>
    `;

    window._quizAnswer = (i) => this.answer(i);
    window._quizNext = () => this.next();
  }

  answer(i) {
    if (this.answered) return;
    this.answered = true;
    const q = this.questions[this.current];
    const opts = this.container.querySelectorAll('.quiz-option');
    opts.forEach((btn, idx) => {
      btn.style.pointerEvents = 'none';
      if (idx === q.ans) btn.classList.add('correct');
      else if (idx === i && i !== q.ans) btn.classList.add('wrong');
    });
    if (i === q.ans) this.score++;
    const explain = this.container.querySelector('#quiz-explain');
    explain.style.display = 'block';
    explain.querySelector('p').textContent = q.explain;
  }

  next() {
    this.answered = false;
    this.current++;
    this.render();
  }

  showResult() {
    const pct = Math.round((this.score / this.questions.length) * 100);
    const grade = pct >= 80 ? 'Space Explorer' : pct >= 60 ? 'Astronomer' : pct >= 40 ? 'Star Gazer' : 'Cadet';
    const gradeColor = pct >= 80 ? '#00FFC6' : pct >= 60 ? '#00E5FF' : pct >= 40 ? '#FFB820' : '#FF6B6B';

    this.container.innerHTML = `
      <div style="text-align:center;padding:1rem 0">
        <p style="font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:0.4em;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:0.5rem">Quiz Complete</p>
        <div class="quiz-score">${this.score} / ${this.questions.length}</div>
        <p style="font-family:'Orbitron',sans-serif;font-size:clamp(20px,3vw,28px);font-weight:700;color:${gradeColor};margin:0.5rem 0 1rem">${grade}</p>
        <div style="width:180px;height:180px;margin:0 auto 1.5rem;position:relative">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
            <circle cx="90" cy="90" r="80" fill="none" stroke="${gradeColor}" stroke-width="8"
              stroke-dasharray="${2 * Math.PI * 80}" stroke-dashoffset="${2 * Math.PI * 80 * (1 - pct/100)}"
              stroke-linecap="round" transform="rotate(-90 90 90)"
              style="transition:stroke-dashoffset 1.5s ease"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <span style="font-family:'Space Grotesk',sans-serif;font-size:36px;font-weight:700;color:${gradeColor}">${pct}%</span>
            <span style="font-size:10px;letter-spacing:0.2em;color:rgba(255,255,255,0.4)">ACCURACY</span>
          </div>
        </div>
        <button onclick="window._quizRestart()" class="btn-primary" style="margin:0 auto">
          <span>↺ TRY AGAIN</span>
        </button>
      </div>
    `;

    window._quizRestart = () => {
      this.questions = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 8);
      this.current = 0;
      this.score = 0;
      this.answered = false;
      this.render();
    };
  }
}
