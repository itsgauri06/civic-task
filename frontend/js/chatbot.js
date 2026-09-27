/**
 * chatbot.js
 * ---------------------------------------------------------------
 * Level 2 Civic Task Assistant
 *
 * - Uses /api/chat for the AI response
 * - Sends conversation history for follow-up questions
 * - Sends city/state from the main form
 * - Displays official source links returned by the backend
 * - Falls back to the Level 1 rule engine if the backend/LLM fails
 * - Uses the same task data/API as the rest of the application
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  // ===============================================================
  // 1. CONFIG
  // ===============================================================

  const CONFIG = {
    mode: "llm",
    llmEndpoint: "/api/chat",
    maxHistory: 12,
    fallbackOnError: true
  };


  // ===============================================================
  // 2. CONVERSATION HISTORY
  // ===============================================================

  const history = [];

  function pushHistory(role, text) {
    if (!text) return;

    history.push({
      role,
      text
    });

    while (history.length > CONFIG.maxHistory) {
      history.shift();
    }
  }


  // ===============================================================
  // 3. TASK ALIASES
  // ===============================================================

  const TASK_ALIASES = {

    "register-small-business-in": [
      "business",
      "small business",
      "company",
      "startup",
      "shop",
      "enterprise",
      "msme",
      "udyam",
      "incorporate",
      "incorporation",
      "llp",
      "pvt ltd",
      "private limited",
      "proprietorship",
      "gst",
      "trade license",
      "trade licence"
    ],

    "apply-passport-in": [
      "passport",
      "passport seva",
      "psk",
      "travel document",
      "renew passport",
      "renew my passport"
    ],

    "apply-pan-in": [
      "pan",
      "pan card",
      "permanent account number",
      "tax id",
      "income tax pan"
    ],

    "apply-driving-license-in": [
      "driving licence",
      "driving license",
      "driver's license",
      "drivers license",
      "learner's licence",
      "learners licence",
      "learner licence",
      "learner's license",
      "rto",
      "driving test"
    ]
  };


  // ===============================================================
  // 4. RULE ENGINE
  // ===============================================================

  const STOPWORDS = new Set([
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "your",
    "from",
    "have",
    "what",
    "when",
    "where",
    "does",
    "how",
    "much",
    "long",
    "will",
    "need",
    "about",
    "into",
    "step",
    "steps",
    "task",
    "tasks",
    "apply",
    "application",
    "can",
    "you",
    "tell",
    "me"
  ]);

  const ACRONYMS = new Set([
    "gst",
    "pan",
    "dl",
    "rto"
  ]);


  const QUESTION_TYPES = [

    {
      type: "documents",
      re: /\b(document|documents|paper|papers|paperwork|proof|id proof|what.*need|what.*bring|what.*carry)\b/i
    },

    {
      type: "fee",
      re: /\b(fee|fees|cost|price|charge|charges|how much|payment|pay)\b/i
    },

    {
      type: "time",
      re: /\b(how long|duration|turnaround|takes?|days?|weeks?|time|when.*complete)\b/i
    },

    {
      type: "office",
      re: /\b(where|office|department|authority|whom|which office|who handles|where.*apply|where.*go)\b/i
    },

    {
      type: "eligibility",
      re: /\b(eligib|who can|qualify|allowed|requirement|requirements)\b/i
    },

    {
      type: "next",
      re: /\b(next|after (this|that)|then what|what.*next|afterwards|afterward)\b/i
    },

    {
      type: "count",
      re: /\b(how many steps|number of steps|how many stages)\b/i
    },

    {
      type: "overview",
      re: /\b(steps|procedure|process|how do i|walk me through|guide|what.*do i.*do|how can i)\b/i
    }
  ];


  const GREETING_RE =
    /^\s*(hi|hello|hey|hola|namaste|yo)\b/i;

  const THANKS_RE =
    /\b(thanks|thank you|thx|cheers)\b/i;

  const BYE_RE =
    /\b(bye|goodbye|see ya|that's all|that is all)\b/i;

  const HELP_RE =
    /\b(help|what can you do|what do you do|capabilities|how can you help)\b/i;

  const LIST_RE =
    /\b(what tasks|list (of )?tasks|what (all )?can i ask|options|what topics)\b/i;


  // ===============================================================
  // 5. TASK DATA CACHE
  // ===============================================================

  let taskCache = null;
  let loadPromise = null;


  async function loadAllTasks() {

    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = (async function () {

      if (
        typeof API === "undefined" ||
        typeof API.listTasks !== "function" ||
        typeof API.getTask !== "function"
      ) {
        throw new Error(
          "Task API is not available"
        );
      }

      const summaries = await API.listTasks();

      const fullTasks = await Promise.all(
        summaries.map(function (task) {
          return API.getTask(task.id);
        })
      );

      taskCache = Object.fromEntries(
        fullTasks.map(function (task) {
          return [task.id, task];
        })
      );

      return taskCache;

    })();

    return loadPromise;
  }


  // ===============================================================
  // 6. TEXT HELPERS
  // ===============================================================

  function words(str) {

    return (str || "")
      .toLowerCase()
      .split(/[^a-z0-9']+/)
      .filter(function (word) {

        return (
          (word.length > 3 || ACRONYMS.has(word)) &&
          !STOPWORDS.has(word)
        );

      });
  }


  function stem(word) {

    if (!word) {
      return "";
    }

    return word.length <= 6
      ? word
      : word.slice(0, 6);
  }


  // ===============================================================
  // 7. TASK MATCHING
  // ===============================================================

  function matchTask(text) {

    const needle = text.toLowerCase();

    let bestTask = null;
    let bestScore = 0;

    Object.values(taskCache || {}).forEach(function (task) {

      let score = 0;

      const aliases =
        TASK_ALIASES[task.id] || [];

      aliases.forEach(function (alias) {

        if (needle.includes(alias)) {

          score +=
            alias.length > 5
              ? 2
              : 1;
        }

      });


      words(task.title).forEach(function (word) {

        if (needle.includes(word)) {
          score += 1;
        }

      });


      if (score > bestScore) {

        bestScore = score;
        bestTask = task;

      }

    });

    return bestScore > 0
      ? bestTask
      : null;
  }


  // ===============================================================
  // 8. STEP MATCHING
  // ===============================================================

  function distinctiveStepWords(step, task) {

    const taskWords =
      new Set(
        words(task.title).map(stem)
      );

    return words(step.title)
      .map(function (word) {

        return {
          word,
          stem: stem(word)
        };

      })
      .filter(function (item) {

        return !taskWords.has(item.stem);

      });
  }


  function scoreStep(step, task, text) {

    const needle =
      text.toLowerCase();

    let score = 0;

    distinctiveStepWords(
      step,
      task
    ).forEach(function (item) {

      if (
        needle.includes(item.stem)
      ) {

        score +=
          ACRONYMS.has(item.word)
            ? 2
            : 1;

      }

    });

    return score;
  }


  function matchStepWithinTask(
    text,
    task
  ) {

    let bestStep = null;
    let bestScore = 0;

    (task.steps || []).forEach(
      function (step) {

        const score =
          scoreStep(
            step,
            task,
            text
          );

        if (score > bestScore) {

          bestScore = score;
          bestStep = step;

        }

      }
    );

    return bestScore > 0
      ? bestStep
      : null;
  }


  function matchStepGlobal(text) {

    let bestTask = null;
    let bestStep = null;
    let bestScore = 0;

    Object.values(
      taskCache || {}
    ).forEach(function (task) {

      (task.steps || []).forEach(
        function (step) {

          const score =
            scoreStep(
              step,
              task,
              text
            );

          if (score > bestScore) {

            bestScore = score;
            bestTask = task;
            bestStep = step;

          }

        }
      );

    });

    return bestScore >= 2
      ? {
          task: bestTask,
          step: bestStep
        }
      : null;
  }


  // ===============================================================
  // 9. QUESTION TYPE
  // ===============================================================

  function matchQuestionType(text) {

    for (
      const question of QUESTION_TYPES
    ) {

      if (
        question.re.test(text)
      ) {
        return question.type;
      }

    }

    return null;
  }


  // ===============================================================
  // 10. SESSION CONTEXT
  // ===============================================================

  const session = {
    taskId: null,
    stepId: null
  };


  function taskListSentence() {

    return Object.values(
      taskCache || {}
    )
      .map(function (task) {
        return `“${task.title}”`;
      })
      .join(", ");
  }


  function stepsInOrder(task) {

    return [
      ...(task.steps || [])
    ].sort(function (a, b) {

      return (
        (a.tier ?? 0) -
        (b.tier ?? 0)
      );

    });
  }


  // ===============================================================
  // 11. LEVEL 1 FALLBACK RESPONSE
  // ===============================================================

  function ruleBasedReply(rawText) {

    const text =
      rawText.trim();

    if (!text) {

      return (
        "Type a question and I'll help you with the available civic tasks."
      );
    }


    if (
      GREETING_RE.test(text) &&
      text.length < 25
    ) {

      return (
        `Hi! I can help with ${taskListSentence()}. ` +
        "Ask me about documents, fees, timing, steps, eligibility, or what comes next."
      );

    }


    if (
      THANKS_RE.test(text)
    ) {

      return (
        "You're welcome! You can ask me about fees, documents, timing, eligibility, or the next step."
      );

    }


    if (
      BYE_RE.test(text)
    ) {

      return (
        "Good luck with the process! Come back if you get stuck on a step."
      );

    }


    if (
      HELP_RE.test(text) ||
      LIST_RE.test(text)
    ) {

      return (
        `I can currently help with: ${taskListSentence()}.\n\n` +

        "Try asking:\n" +

        "• What documents do I need for a passport?\n" +

        "• How much does it cost?\n" +

        "• What comes before GST registration?\n" +

        "• What's next after the learner's licence?"
      );

    }


    const taskHit =
      matchTask(text);

    const stepHit =
      taskHit
        ? null
        : matchStepGlobal(text);


    let task =
      taskHit ||
      (stepHit && stepHit.task) ||
      (
        session.taskId
          ? taskCache[session.taskId]
          : null
      );


    if (!task) {

      return (
        `I couldn't identify the task. ` +
        `I can currently help with: ${taskListSentence()}. ` +
        "Which one do you mean?"
      );

    }


    const taskChanged =
      session.taskId &&
      session.taskId !== task.id;


    let step =
      stepHit
        ? stepHit.step
        : (
            taskHit
              ? matchStepWithinTask(
                  text,
                  task
                )
              : null
          );


    if (
      !step &&
      !taskChanged &&
      session.stepId
    ) {

      step =
        (task.steps || [])
          .find(function (item) {
            return (
              item.id ===
              session.stepId
            );
          }) || null;

    }


    session.taskId =
      task.id;

    session.stepId =
      step
        ? step.id
        : null;


    const questionType =
      matchQuestionType(text) ||
      "overview";


    return step
      ? replyForStep(
          task,
          step,
          questionType
        )
      : replyForTask(
          task,
          questionType
        );
  }


  // ===============================================================
  // 12. STEP RESPONSE
  // ===============================================================

  function replyForStep(
    task,
    step,
    questionType
  ) {

    switch (questionType) {

      case "documents":

        if (
          step.documentsNeeded &&
          step.documentsNeeded.length
        ) {

          return (
            `Documents needed for “${step.title}”:\n` +
            bulletList(
              step.documentsNeeded
            )
          );

        }

        return (
          `The dataset does not list specific documents for “${step.title}”.`
        );


      case "fee":

        return (
          `The listed fee for “${step.title}” is ${step.fee}.`
        );


      case "time":

        return (
          `The listed typical time for “${step.title}” is ${step.estimatedTime}.`
        );


      case "office":

        return (
          `“${step.title}” is handled by: ${step.office}.`
        );


      case "eligibility":

        return (
          `Eligibility for “${step.title}”: ${step.eligibility}.`
        );


      case "next": {

        const nextSteps =
          (task.steps || [])
            .filter(function (candidate) {

              return (
                candidate.dependsOn || []
              ).includes(step.id);

            });


        if (
          nextSteps.length
        ) {

          return (
            `After “${step.title}”, the roadmap lists:\n` +

            nextSteps
              .map(function (item) {
                return `• ${item.title}`;
              })
              .join("\n")
          );

        }


        return (
          `The roadmap does not list a step that directly depends on “${step.title}”.`
        );
      }


      case "count":

        return (
          `“${step.title}” is one step within the “${task.title}” process. ` +
          `The full roadmap has ${(task.steps || []).length} steps.`
        );


      default:

        return (
          `${step.title}\n\n` +

          `${step.description || "No description is listed."}\n\n` +

          `Fee: ${step.fee}\n` +

          `Typical time: ${step.estimatedTime}\n` +

          `Office: ${step.office}\n\n` +

          "You can ask me about its documents, eligibility, fee, timing, or what comes next."
        );

    }
  }


  // ===============================================================
  // 13. TASK RESPONSE
  // ===============================================================

  function replyForTask(
    task,
    questionType
  ) {

    const ordered =
      stepsInOrder(task);


    switch (questionType) {

      case "documents": {

        const withDocuments =
          ordered.filter(function (step) {

            return (
              step.documentsNeeded &&
              step.documentsNeeded.length
            );

          });


        if (
          !withDocuments.length
        ) {

          return (
            `The dataset does not list specific documents for “${task.title}”.`
          );

        }


        return (
          `Documents listed for “${task.title}”:\n` +

          withDocuments
            .map(function (step) {

              return (
                `• ${step.title}: ` +
                step.documentsNeeded.join(", ")
              );

            })
            .join("\n")
        );

      }


      case "fee":

        return (
          `Fees listed for “${task.title}”:\n` +

          ordered
            .map(function (step) {

              return (
                `• ${step.title}: ${step.fee}`
              );

            })
            .join("\n")
        );


      case "time":

        return (
          `Typical timing listed for “${task.title}”:\n` +

          ordered
            .map(function (step) {

              return (
                `• ${step.title}: ${step.estimatedTime}`
              );

            })
            .join("\n")
        );


      case "office":

        return (
          `Offices/departments listed for “${task.title}”:\n` +

          ordered
            .map(function (step) {

              return (
                `• ${step.title}: ${step.office}`
              );

            })
            .join("\n")
        );


      case "eligibility":

        return (
          `The eligibility information varies by step. ` +
          `Ask me about a specific step in “${task.title}”.`
        );


      case "count":

        return (
          `“${task.title}” has ${(task.steps || []).length} steps in the loaded roadmap.`
        );


      case "next": {

        const firstSteps =
          ordered.filter(function (step) {

            return (
              (step.tier ?? 0) === 0
            );

          });


        if (!firstSteps.length) {

          return (
            `The roadmap does not specify a first step for “${task.title}”.`
          );

        }


        return (
          `The first step${firstSteps.length > 1 ? "s are" : " is"}:\n` +

          firstSteps
            .map(function (step) {
              return `• ${step.title}`;
            })
            .join("\n")
        );

      }


      default:

        return (
          `${task.title}\n\n` +

          `${task.summary || "No summary is listed."}\n\n` +

          "Steps:\n" +

          ordered
            .map(function (step, index) {

              return (
                `${index + 1}. ${step.title}`
              );

            })
            .join("\n") +

          "\n\nYou can ask me about documents, fees, timing, eligibility, offices, or what comes next."
        );
    }
  }


  function bulletList(items) {

    return items
      .map(function (item) {
        return `• ${item}`;
      })
      .join("\n");
  }


  // ===============================================================
  // 14. HTML SAFETY
  // ===============================================================

  function escapeHtml(text) {

    const div =
      document.createElement("div");

    div.textContent =
      text || "";

    return div.innerHTML;
  }


  function formatMessage(text) {

    return escapeHtml(text)
      .split("\n")
      .map(function (line) {

        if (
          line.startsWith("• ")
        ) {

          return (
            `<span class="cb-bullet">${line}</span>`
          );

        }

        return line;

      })
      .join("<br>");
  }


  // ===============================================================
  // 15. LOCATION
  // ===============================================================

  function getLocation() {

    return {

      state:
        document
          .querySelector("#state-input")
          ?.value
          ?.trim() || "",

      city:
        document
          .querySelector("#city-input")
          ?.value
          ?.trim() || ""

    };
  }


  // ===============================================================
  // 16. LEVEL 2 — CALL BACKEND
  // ===============================================================

  async function callLlmBackend(
    rawText
  ) {

    const location =
      getLocation();


    const baseUrl =
      typeof API !== "undefined" &&
      API.baseUrl
        ? API.baseUrl
        : "";


    const response =
      await fetch(
        `${baseUrl}${CONFIG.llmEndpoint}`,
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            message:
              rawText,

            history:
              history.slice(
                -CONFIG.maxHistory
              ),

            location

          })

        }
      );


    let body;

    try {

      body =
        await response.json();

    } catch (error) {

      throw new Error(
        "The chatbot server returned an invalid response."
      );

    }


    if (!response.ok) {

      throw new Error(
        body?.error ||
        `Chat backend returned ${response.status}`
      );

    }


    if (
      !body ||
      !body.reply
    ) {

      throw new Error(
        "The chatbot backend returned no reply."
      );

    }


    return {

      text:
        body.reply,

      sources:
        Array.isArray(
          body.sources
        )
          ? body.sources
          : []

    };
  }


  // ===============================================================
  // 17. MAIN GET REPLY
  // ===============================================================

  async function getReply(
    rawText
  ) {

    await loadAllTasks();


    pushHistory(
      "user",
      rawText
    );


    let result;


    if (
      CONFIG.mode === "llm"
    ) {

      try {

        result =
          await callLlmBackend(
            rawText
          );

      } catch (error) {

        console.warn(
          "LLM chatbot unavailable. Falling back to rule engine.",
          error
        );


        if (
          !CONFIG.fallbackOnError
        ) {

          throw error;

        }


        result = {

          text:
            ruleBasedReply(
              rawText
            ),

          sources: []

        };

      }

    } else {

      result = {

        text:
          ruleBasedReply(
            rawText
          ),

        sources: []

      };

    }


    pushHistory(
      "bot",
      result.text
    );


    return result;
  }


  // ===============================================================
  // 18. CHAT SUGGESTIONS
  // ===============================================================

  const SUGGESTIONS = [

    "What documents do I need for a passport?",

    "How much does registering a business cost?",

    "What's next after the learner's licence?",

    "How do I apply for PAN?"

  ];


  // ===============================================================
  // 19. CHAT WIDGET
  // ===============================================================

  function buildWidget() {

    const existing =
      document.querySelector(
        "#cb-root"
      );

    if (existing) {
      existing.remove();
    }


    const root =
      document.createElement("div");

    root.id =
      "cb-root";


    root.innerHTML = `

      <button
        id="cb-toggle"
        class="cb-toggle"
        aria-label="Open task assistant"
        aria-expanded="false"
      >
        <span class="cb-toggle-icon">💬</span>
      </button>


      <div
        id="cb-panel"
        class="cb-panel"
        hidden
      >

        <div class="cb-header">

          <div>

            <p class="cb-header-title">
              Task Assistant
            </p>

            <p class="cb-header-sub">
              AI-powered · grounded in the loaded tasks
            </p>

          </div>


          <button
            id="cb-close"
            class="cb-close"
            aria-label="Close"
          >
            ×
          </button>

        </div>


        <div
          id="cb-messages"
          class="cb-messages"
        ></div>


        <div
          id="cb-suggestions"
          class="cb-suggestions"
        ></div>


        <form
          id="cb-form"
          class="cb-form"
        >

          <input
            id="cb-input"
            class="cb-input"
            type="text"
            autocomplete="off"
            placeholder="Ask about fees, documents, timing…"
          />


          <button
            type="submit"
            class="cb-send"
            aria-label="Send"
          >
            ➤
          </button>

        </form>

      </div>
    `;


    document.body.appendChild(
      root
    );


    const toggleButton =
      root.querySelector(
        "#cb-toggle"
      );

    const closeButton =
      root.querySelector(
        "#cb-close"
      );

    const panel =
      root.querySelector(
        "#cb-panel"
      );

    const messages =
      root.querySelector(
        "#cb-messages"
      );

    const suggestions =
      root.querySelector(
        "#cb-suggestions"
      );

    const form =
      root.querySelector(
        "#cb-form"
      );

    const input =
      root.querySelector(
        "#cb-input"
      );


    let opened = false;


    // =============================================================
    // ADD MESSAGE
    // =============================================================

    function addMessage(
      text,
      who,
      sources = []
    ) {

      const bubble =
        document.createElement(
          "div"
        );


      bubble.className =
        `cb-msg cb-msg-${who}`;


      bubble.innerHTML =
        formatMessage(text);


      // -----------------------------------------------------------
      // Official sources
      // -----------------------------------------------------------

      const safeSources =
        Array.isArray(sources)
          ? sources.filter(
              function (source) {

                return (
                  source &&
                  /^https?:\/\//i.test(
                    source.url || ""
                  )
                );

              }
            )
          : [];


      if (
        safeSources.length
      ) {

        const sourceBox =
          document.createElement(
            "div"
          );


        sourceBox.className =
          "cb-sources";


        const sourceLabel =
          document.createElement(
            "div"
          );


        sourceLabel.className =
          "cb-source-label";


        sourceLabel.textContent =
          "Official source";


        sourceBox.appendChild(
          sourceLabel
        );


        safeSources.forEach(
          function (source) {

            const link =
              document.createElement(
                "a"
              );


            link.className =
              "cb-source-link";


            link.href =
              source.url;


            link.target =
              "_blank";


            link.rel =
              "noopener noreferrer";


            link.textContent =
              source.title ||
              "Open official source";


            sourceBox.appendChild(
              link
            );

          }
        );


        bubble.appendChild(
          sourceBox
        );

      }


      messages.appendChild(
        bubble
      );


      messages.scrollTop =
        messages.scrollHeight;
    }


    // =============================================================
    // TYPING INDICATOR
    // =============================================================

    function addTyping() {

      removeTyping();


      const bubble =
        document.createElement(
          "div"
        );


      bubble.className =
        "cb-msg cb-msg-bot cb-typing";


      bubble.id =
        "cb-typing";


      bubble.innerHTML =
        `
          <span></span>
          <span></span>
          <span></span>
        `;


      messages.appendChild(
        bubble
      );


      messages.scrollTop =
        messages.scrollHeight;
    }


    function removeTyping() {

      const typing =
        document.querySelector(
          "#cb-typing"
        );


      if (typing) {
        typing.remove();
      }
    }


    // =============================================================
    // SUGGESTION CHIPS
    // =============================================================

    function renderSuggestions(
      list
    ) {

      suggestions.innerHTML =
        "";


      list.forEach(
        function (suggestion) {

          const button =
            document.createElement(
              "button"
            );


          button.type =
            "button";


          button.className =
            "cb-chip";


          button.textContent =
            suggestion;


          button.addEventListener(
            "click",
            function () {

              handleUserText(
                suggestion
              );

            }
          );


          suggestions.appendChild(
            button
          );

        }
      );
    }


    // =============================================================
    // SEND MESSAGE
    // =============================================================

    async function handleUserText(
      text
    ) {

      const cleanText =
        String(text || "").trim();


      if (!cleanText) {
        return;
      }


      addMessage(
        cleanText,
        "user"
      );


      input.value =
        "";


      suggestions.innerHTML =
        "";


      input.disabled =
        true;


      addTyping();


      try {

        const results =
          await Promise.all([

            getReply(
              cleanText
            ),

            new Promise(
              function (resolve) {

                setTimeout(
                  resolve,
                  250
                );

              }
            )

          ]);


        const result =
          results[0];


        removeTyping();


        addMessage(
          result.text,
          "bot",
          result.sources
        );


      } catch (error) {

        console.error(
          "Chatbot error:",
          error
        );


        removeTyping();


        addMessage(
          "Couldn't load the task assistant right now. Please make sure the backend server is running and try again.",
          "bot"
        );

      } finally {

        input.disabled =
          false;

        input.focus();

      }
    }


    // =============================================================
    // OPEN / CLOSE
    // =============================================================

    toggleButton.addEventListener(
      "click",
      function () {

        opened =
          !opened;


        panel.hidden =
          !opened;


        toggleButton.setAttribute(
          "aria-expanded",
          String(opened)
        );


        if (
          opened &&
          !messages.childElementCount
        ) {

          addMessage(

            "Hi! What are you trying to get done — registering a business, a passport, a PAN card, or a driving licence?",

            "bot"

          );


          renderSuggestions(
            SUGGESTIONS
          );


          input.focus();

        }

      }
    );


    closeButton.addEventListener(
      "click",
      function () {

        opened =
          false;


        panel.hidden =
          true;


        toggleButton.setAttribute(
          "aria-expanded",
          "false"
        );

      }
    );


    // =============================================================
    // FORM SUBMIT
    // =============================================================

    form.addEventListener(
      "submit",
      function (event) {

        event.preventDefault();


        const text =
          input.value.trim();


        if (text) {

          handleUserText(
            text
          );

        }

      }
    );


    // =============================================================
    // ENTER KEY
    // =============================================================

    input.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();


          const text =
            input.value.trim();


          if (text) {

            handleUserText(
              text
            );

          }

        }

      }
    );

  }


  // ===============================================================
  // 20. INITIALIZE
  // ===============================================================

  function initialize() {

    try {

      buildWidget();

    } catch (error) {

      console.error(
        "Failed to initialize chatbot:",
        error
      );

    }

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  } else {

    initialize();

  }


  // ===============================================================
  // 21. PUBLIC TESTING API
  // ===============================================================

  window.ChatBot = {

    getReply,

    resetSession: function () {

      session.taskId =
        null;

      session.stepId =
        null;

      history.length =
        0;

    },

    getHistory: function () {

      return [
        ...history
      ];

    }

  };

})();