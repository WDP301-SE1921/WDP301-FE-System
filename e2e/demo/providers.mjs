// Only external providers are simulated. Application APIs, DB, storage and UI stay real.
import http from "node:http";
import net from "node:net";

const mail = [];
const calls = [];
http
  .createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.method === "GET") {
      res.end(
        JSON.stringify({ provider: "deterministic local E2E", mail, calls }),
      );
      return;
    }
    try {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const request = JSON.parse(raw);
      const system = request.messages[0].content;
      const content = request.messages[1].content;
      const data = JSON.parse(
        typeof content === "string" ? content : content[0].text,
      );
      let result;
      if (system.includes("Read student work")) {
        result = {
          answers: data.questions.map((q) => ({
            questionId: q.id,
            answer:
              data.typedAnswers?.find((a) => a.questionId === q.id)?.answer ||
              "x = 2; 2x + 3 = 7.",
            readable: true,
            sources: (data.pages || [])
              .filter((p) => {
                const mapping = data.typedAnswers?.find(
                  (a) => a.questionId === q.id,
                )?.fileIds;
                return !mapping?.length || mapping.includes(p.fileId);
              })
              .map((p) => ({ fileId: p.fileId, page: p.page })),
            reason: "Dữ liệu đọc từ nhà cung cấp kiểm thử cục bộ.",
          })),
        };
      } else if (system.includes("learning summary")) {
        result = {
          summary: `Tóm tắt kiểm thử: ${data.rows.length} học sinh; chỉ dùng số liệu đã chốt và điểm đã công bố.`,
        };
      } else {
        result = {
          scores: data.questions.map((q) => ({
            questionId: q.id,
            score: q.maxScore,
            feedback:
              "Gợi ý kiểm thử: trình bày rõ ràng. Giáo viên cần kiểm tra trước khi công bố.",
            criteria: (q.criteria || []).map((c) => ({
              criterionId: c.id,
              score: c.maxScore,
              feedback: "Đạt tiêu chí kiểm thử.",
            })),
          })),
        };
      }
      calls.push({
        kind: system.includes("Read student work")
          ? "reading"
          : system.includes("learning summary")
            ? "summary"
            : "grading",
        at: new Date().toISOString(),
      });
      res.end(
        JSON.stringify({
          choices: [
            {
              finish_reason: "stop",
              message: { content: JSON.stringify(result) },
            },
          ],
        }),
      );
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message }));
    }
  })
  .listen(3900, "127.0.0.1", () =>
    console.log("Local AI/mail evidence: http://127.0.0.1:3900"),
  );

net
  .createServer((socket) => {
    socket.setEncoding("utf8");
    socket.write("220 localhost E2E SMTP\r\n");
    let buffer = "",
      data = false,
      lines = [],
      recipients = [];
    socket.on("data", (chunk) => {
      buffer += chunk;
      let at;
      while ((at = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, at);
        buffer = buffer.slice(at + 2);
        if (data) {
          if (line === ".") {
            mail.push({
              recipients,
              message: lines.join("\n"),
              at: new Date().toISOString(),
            });
            data = false;
            lines = [];
            recipients = [];
            socket.write("250 Message captured locally\r\n");
          } else lines.push(line);
        } else if (/^(EHLO|HELO)/i.test(line))
          socket.write("250-localhost\r\n250 8BITMIME\r\n");
        else if (/^RCPT TO:/i.test(line)) {
          recipients.push(line.slice(8));
          socket.write("250 OK\r\n");
        } else if (/^DATA/i.test(line)) {
          data = true;
          socket.write("354 End with dot\r\n");
        } else if (/^QUIT/i.test(line)) socket.end("221 Bye\r\n");
        else socket.write("250 OK\r\n");
      }
    });
    socket.on("error", () => {});
  })
  .listen(1026, "127.0.0.1");
