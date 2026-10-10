# Web: tích hợp API BE hiện có

Cập nhật 10/10/2026. Chỉ sửa WDP301-FE-System; không sửa BE/Mobile. [Audit theo SRS](API_GAP_BY_ROLE_SRS.md) ghi trạng thái trước lượt này.

## Các màn đã nối

| Role             | Màn hình                                 | API                                                                                                                           |
| ---------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Manager          | Dashboard ngày                           | GET /dashboard: doanh thu xác nhận, đăng ký và tài khoản thật                                                                 |
| Manager          | Teacher/Staff và chi tiết                | GET/POST /teachers và /staff; GET/PATCH /teachers/:id và /staff/:id; tạo trực tiếp bằng mật khẩu ban đầu; khóa/mở bằng status |
| Manager          | Chi tiết Parent/Student                  | GET/PATCH /parents/:id; GET /students; GET /students/:id/enrollments và /schedule                                             |
| Manager          | Thông báo/nhắc học phí                   | GET/POST /academic/announcements; POST /announcements/:id/send-email và /tuition-reminders/send-email                         |
| Designer/Manager | /manager/curriculum/feedback             | GET /academic/lessons và /feedback; POST /feedback/:id/resolve                                                                |
| Staff            | Danh sách đăng ký/thanh toán             | GET /registrations và /payments; phân trang, search, ngày, trạng thái đăng ký, tổng thu; giữ tra mã, bill, biên lai và wizard |
| Staff            | Chi tiết con                             | GET /students; GET /students/:id/enrollments và /schedule                                                                     |
| Staff            | /staff/absences/makeup, swap, long-leave | Đọc/tạo nghỉ một buổi và kỳ nghỉ; duyệt/từ chối/hủy; đọc nguồn/candidate, đặt/hủy học bù                                      |
| Staff            | /staff/absences/change-class, withdraw   | POST /academic/enrollments/:id/transfer và /end; POST /academic/students/:id/end-study                                        |
| Teacher          | Dashboard                                | Lớp được giao, buổi hôm nay, bài nộp và thông báo; bỏ identity/số đếm mẫu                                                     |
| Teacher          | Điểm danh                                | GET scheduled-sessions/detail; GET/POST /academic/sessions/:id/roster; POST finalize-attendance                               |
| Teacher          | Bài tập/giao bài                         | GET/POST assignments, GET/PATCH detail; publish/close/reopen/publish-answers; submissions theo assignment                     |
| Teacher          | Bài nộp/chấm bài                         | grades, grade-objective, grade-ai; GET grading-jobs/:id; approve/publish grade; GET files/:id/download                        |
| Teacher          | Báo cáo                                  | GET/POST reports: class/student/date/includeAi; tải XLSX/PDF binary thật                                                      |
| Teacher          | /teacher/feedback                        | Đọc bài được phân công; gửi/theo dõi feedback                                                                                 |
| Mọi role Web     | Tài khoản                                | GET /auth/me, thông tin phiên thật                                                                                            |

Các đường Academic trong bảng có tiền tố /academic. API client và BFF nằm ở [academic/api.ts](../src/features/academic/api.ts), [directory/api.ts](../src/features/directory/api.ts), [permissions](../src/lib/api/backend-permissions.ts).

Luồng Subject/Program/Class/lịch tuần, Unit/CSV/review/revision và preview/generate/reschedule/cancel đã nối từ trước được giữ nguyên; xem [Academic integration](ACADEMIC_API_INTEGRATION.md). Web dùng Unit và scheduled-session hiện hành, không tạo màn trùng cho alias legacy /academic/programs, /academic/classes hoặc đường soạn bài/sinh buổi đơn lẻ cũ.

## Luồng thao tác

1. Manager tạo Teacher/Staff → môn/khóa/lớp/lịch tuần → duyệt giáo trình → preview/sinh buổi → xem doanh thu → tạo thông báo → chủ động gửi và xem kết quả email.
2. Designer soạn bài/kiểm tra tháng → validation/submit → sửa theo review → revision Unit; đọc và trả lời feedback.
3. Staff chọn con → đăng ký lớp/kỳ → bill → nhận đủ tiền/confirm → tra biên lai. Khi nghỉ, chọn ghi danh → ghi hoặc duyệt đơn → chọn nguồn và buổi cùng bài → xác nhận học bù; hoặc chuyển lớp, kết thúc môn, nghỉ hẳn.
4. Teacher mở buổi → chuẩn bị roster → chọn kết quả từng học viên → xác nhận chốt sau khi buổi kết thúc. Tạo nháp bài tập → chọn người nhận → giao bài → xem bài nộp → chấm tay/trắc nghiệm hoặc AI → kiểm tra/lưu nháp → duyệt → công bố → tạo/tải báo cáo.

AI thành công chỉ trả đề xuất: Teacher chủ động đưa vào bản chấm, kiểm tra, lưu DRAFT, duyệt APPROVED rồi công bố PUBLISHED. Web polling mỗi 2 giây khi job đang xử lý, chỉ dùng kết quả của đúng submission. Bài đính kèm cần chấm tay; Teacher tải bằng URL ký của BE, không upload bằng quyền Parent.

## Quyền và giới hạn

- BFF mở đúng method/path/role, xác thực bằng BE, giữ origin check và cookie HttpOnly. Các mutation nghỉ/học bù/chuyển/end chỉ cho Staff; chốt điểm danh và chấm bài chỉ cho Teacher theo SRS.
- Mutation parse Zod, loại field UI/actor giả; datetime đổi UTC+7 sang UTC. Có pending/error và xác nhận ở thao tác chốt/công bố/kết thúc. Không tự retry mutation.
- Đọc đủ trang của list Academic. Queue bài nộp ghép theo assignment, tối đa 4 assignment song song vì BE chưa có endpoint tổng hợp.
- Binary download giữ bytes/content-type/content-disposition qua BFF; lỗi JSON download được hiển thị như lỗi API.
- Nghỉ một buổi yêu cầu roster do Teacher chuẩn bị trước. Web hướng dẫn điều kiện này, không tạo roster bằng quyền Staff.
- BE kiểm tra cùng bài/kỳ học/sĩ số/trùng lịch/placement. Web không suy diễn chỗ trống từ participant hiện tại; không tự chỉnh bill sau chuyển lớp.
- BE giữ khóa participant sau hủy booking, nên chưa đặt lại được cùng buổi cho cùng ghi danh. Web loại buổi đã từng đặt khỏi lựa chọn và yêu cầu chọn buổi thay thế khác.
- Chưa có API: học lại INACTIVE, rooms, invitation/duyệt Teacher, thêm Manager, dạy thay/đổi giáo viên từ ngày hiệu lực, đóng bảo lưu sớm, đổi booking trực tiếp, lịch sử/retry email và đổi/quên mật khẩu. Màn liên quan hiển thị chưa hỗ trợ.
- Kết quả email SENT/FAILED là lần gửi vừa thực hiện. Lưu announcement không có nghĩa đã gửi. BE chưa có email tự động bền vững cho confirm/attendance/workflows.
- DB chạy ứng dụng cần migration Academic hiện có. Lượt này không tự migrate DB ứng dụng; kiểm thử dùng MySQL biệt lập.

## Xác minh

Kết quả ngày 10/10/2026: tất cả kiểm tra dưới đây đạt. Tests local và screenshots tuân theo ignore của repo.

| Kiểm tra                                    | Kết quả              | Phạm vi                                                                                                                                                                |
| ------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript/lint/production build            | PASS                 | Toàn Web; build thành công 56 trang; lint 0 lỗi, warning cũ ghi bên dưới                                                                                               |
| Logic/BFF                                   | 62/62 PASS           | 55 ca hồi quy + 7 nhóm mới: role, binary/refresh, chặn API Parent, DTO/date/question/confirmation, phân trang, loại target học bù đã đặt                               |
| HTTP production hồi quy                     | 1/1 PASS             | Curriculum editing/approval, session replay, enrollment/payment                                                                                                        |
| Production HTTP + BE/MySQL riêng + Chromium | 1/1 PASS (65,9 giây) | Directory/payment/dashboard, leave/decide/cancel/makeup/transfer/end/end-study, assignment/grade/job, feedback/report/email command; thao tác UI bên dưới              |
| Chromium UI thật                            | PASS                 | Account create/edit, list/detail, nghỉ kỳ, attendance, assignment publish, reviewed grades, AI polling, PDF, feedback; CSV/review/reschedule hồi quy và viewport 390px |

SMTP transport và AI provider trong test dùng dữ liệu kiểm thử để không gửi email/gọi AI ra ngoài. Job, quyền, persistence và API BFF/BE vẫn chạy thật; test này không xác nhận cấu hình SMTP/S3/AI production.

Test dùng hai hồ sơ con cùng Parent: công bố điểm chỉ sau Teacher approve/publish; AI đề xuất không tự tăng số bản chấm; kết thúc một con không đổi trạng thái con còn lại. Parent account/submission chỉ là dữ liệu điều kiện đầu vào của test BE, không sửa hoặc triển khai luồng Mobile. Database kiểm thử được dọn sau khi hoàn tất.

Các lệnh kiểm tra local:

```powershell
npx tsc --noEmit
npm run lint
npm run build
node --test tests/academic-api.test.cjs tests/curriculum-flow.test.cjs tests/registration-flow.test.cjs tests/registration-bill.test.cjs tests/registration-progress.test.cjs tests/web-workflows.test.cjs
npm run test:registration:http
# Chromium dùng ACADEMIC_PLAYWRIGHT_MODULE và ACADEMIC_BROWSER_PATH của môi trường test local.
node --test tests/academic-real-http.test.cjs
```

Lint toàn repo có 0 lỗi, 4 warning unused cũ trong source ngoài file thay đổi và 1 warning cũ trong test desktop local. Các file source thay đổi không có warning. Ảnh bằng chứng local nằm ở `docs/screenshots/web-existing-api-2026-10-10/`.
