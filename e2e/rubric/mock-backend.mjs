// Isolated API fixture for UI tests; never connect this server to real accounts/data.
import http from "node:http";
const user = {
  id: "ui-teacher",
  email: "ui-teacher@example.test",
  displayName: "Giáo viên demo",
  role: "TEACHER",
  status: "ACTIVE",
  hasAvatar: false,
  emailVerifiedAt: "2026-01-01T00:00:00Z",
};
const criteria = [
  {
    id: "method",
    title: "Phương pháp",
    description: "Biến đổi đúng phương trình",
    maxScore: 3,
  },
  {
    id: "result",
    title: "Kết quả",
    description: "Kết luận x = 4",
    maxScore: 1,
  },
];
const assignment = {
  id: "assignment",
  classId: "class",
  title: "Bài tập phương trình",
  instructions: "Trình bày các bước giải",
  kind: "HOMEWORK",
  testType: null,
  sessionId: null,
  status: "PUBLISHED",
  dueAt: "2099-12-10T10:00:00Z",
  maxAttempts: 2,
  outcomeSetId: null,
  learningTargets: [],
  recipients: [{ id: "recipient", enrollmentId: "enrollment" }],
  questions: [
    {
      id: "q",
      kind: "ESSAY",
      prompt: "Giải 2x + 3 = 11",
      choices: null,
      correctAnswer: null,
      rubric: null,
      maxScore: 4,
      criteria,
    },
  ],
  files: [],
};
let grade;
let job;
const cloDraft = {
  id: "clo-set",
  programId: "program",
  level: "Toán 8 cơ bản",
  version: 1,
  status: "DRAFT",
  designerId: "ui-designer",
  reviewerId: null,
  reviewedAt: null,
  approvedById: null,
  approvedAt: null,
  reviewNote: null,
  outcomes: [
    {
      id: "clo-1",
      outcomeSetId: "clo-set",
      code: "CLO1",
      title: "Giải phương trình",
      statement: "Giải được phương trình bậc nhất một ẩn",
      sourceTitle: "Chương trình Toán",
      sourceUrl: "https://example.test/source.pdf",
      sourceLocator: "Trang 12, mục phương trình",
      sourceStatus: "VERIFIED",
      sourceNote: "Đã kiểm tra nguồn",
      verifiedById: user.id,
      verifiedAt: "2026-11-10T01:00:00Z",
      required: true,
      lessonLinks: [{ lessonId: "lesson" }],
    },
  ],
};
let cloSet = { ...cloDraft };
const server = http.createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", "http://127.0.0.1").pathname.replace(
    /^\/api\/v1\//,
    "",
  );
  let data = [];
  let body = "";
  for await (const chunk of req) body += chunk;
  const input =
    req.headers["content-type"]?.includes("application/json") && body
      ? JSON.parse(body)
      : {};
  if (path === "/health") data = { ok: true };
  else if (path === "auth/me")
    data =
      req.headers.authorization === "Bearer isolated-ui-manager"
        ? {
            ...user,
            id: "ui-manager",
            role: "MANAGER",
            displayName: "Quản lý demo",
          }
        : user;
  else if (path === "/__fixtures/clo") {
    cloSet = { ...cloDraft, status: input.status ?? "DRAFT", reviewNote: null };
    data = cloSet;
  } else if (path === "programs/program")
    data = {
      id: "program",
      name: "Toán 8",
      subject: "Toán",
      grade: 8,
      isActive: true,
      classes: [],
    };
  else if (path === "academic/programs/program/outcome-sets") {
    const status = new URL(req.url, "http://127.0.0.1").searchParams.get(
      "status",
    );
    data = !status || status === cloSet.status ? [cloSet] : [];
  } else if (path === "academic/outcome-sets/clo-set/technical-approve") {
    cloSet = {
      ...cloSet,
      status: "APPROVED",
      reviewerId: user.id,
      reviewedAt: "2026-11-10T01:00:00Z",
      approvedById: user.id,
      approvedAt: "2026-11-10T01:00:00Z",
      reviewNote: null,
    };
    data = cloSet;
  } else if (path === "academic/outcome-sets/clo-set/request-changes") {
    cloSet = { ...cloSet, reviewNote: input.reason };
    data = cloSet;
  } else if (path === "classes")
    data = [
      {
        id: "class",
        name: "Toán 8 — Demo",
        teacherId: user.id,
        programId: "program",
        program: { name: "Toán 8", subject: "Toán", grade: 8 },
      },
    ];
  else if (path === "academic/assignments/draft")
    data = {
      ...assignment,
      id: "draft",
      status: "DRAFT",
      questions: [
        {
          ...assignment.questions[0],
          criteria: [],
          rubric: "Barem cũ để tham khảo",
        },
      ],
    };
  else if (path === "academic/assignments/assignment") data = assignment;
  else if (path === "academic/assignments") data = [assignment];
  else if (path === "academic/assignments/assignment/submissions")
    data = [
      {
        id: "submission",
        recipientId: "recipient",
        attemptNo: 1,
        submittedAt: "2026-11-10T01:00:00Z",
        answers: [{ questionId: "q", answer: "" }],
        files: [{ fileId: "image" }],
        grades: grade ? [grade] : [],
      },
    ];
  else if (path === "academic/assignments/import-preview")
    data = {
      fileName: "cau-hoi.csv",
      format: "CSV",
      usedAi: false,
      warnings: [],
      questions: [
        {
          kind: "ESSAY",
          prompt: "Câu nhập từ CSV",
          rubric: "Giải thích đúng",
          maxScore: 4,
        },
      ],
    };
  else if (path === "academic/files" && req.method === "POST")
    data = {
      id: "uploaded",
      name: "de-bai.png",
      mimeType: "image/png",
      size: 80,
    };
  else if (path === "academic/submissions/submission/grade-ai") {
    job = {
      id: "job",
      submissionId: "submission",
      status: "SUCCEEDED",
      result: {
        scores: [
          {
            questionId: "q",
            score: 3,
            feedback: "Thiếu một bước",
            // Intentionally reverse the AI order to exercise ID-based UI mapping.
            criteria: [
              { criterionId: "result", score: 1, feedback: "Đúng nghiệm" },
              {
                criterionId: "method",
                score: 2,
                feedback: "Thiếu bước chuyển vế",
              },
            ],
          },
        ],
        manualReviewQuestionIds: [],
        readings: [
          {
            questionId: "q",
            answer: input.corrections?.[0]?.answer ?? "2x = 8; x = 4",
            readable: true,
            sources: [{ fileId: "image", page: 1 }],
            reason: "Đã đọc từ ảnh",
          },
        ],
      },
      error: null,
    };
    data = job;
  } else if (path === "academic/grading-jobs/job") data = job;
  else if (path === "academic/submissions/submission/grades") {
    grade = {
      ...input,
      id: "grade",
      revision: (grade?.revision ?? 0) + 1,
      totalScore: input.scores.reduce((n, s) => n + s.score, 0),
      status: "DRAFT",
      publishedAt: null,
    };
    data = grade;
  } else if (path === "notifications/unread-count") data = { count: 0 };
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: true, data }));
});
server.listen(3100, "127.0.0.1");
