# Danh sách route BE hiện có trong source

**Ngày đối chiếu: 07/10/2026.** BE HEAD 85caeeb, gồm thay đổi chưa commit trong directory controller/service.

Danh sách được trích từ tất cả controller trong src/modules của WDP301-BE-System: **116 method/path, 6 controller**. Đây là bằng chứng route đã khai báo trong source, không phải xác nhận môi trường deploy đã có route, đủ quyền, đủ field hoặc chạy thành công. Quyền thực tế nằm ở service/guard; xem tài liệu yêu cầu để phân biệt API có sẵn với API cần mở rộng.

Tài liệu liên quan: [Yêu cầu API web/mobile](BACKEND_API_REQUIREMENTS_WEB_MOBILE.md), [đề xuất UI](UI_ACADEMIC_FLOW_PROPOSAL.md).

Các path /academic/programs, /academic/classes và /academic/sessions cùng tồn tại với /programs, /classes và /academic/scheduled-sessions. Client cần dùng endpoint chính đã thống nhất; không xem các route đó là tài nguyên song song để tạo trùng dữ liệu. Health là route vận hành, không phải yêu cầu màn hình học tập.

## Tổng hợp

| Controller                                                            | Số method/path |
| --------------------------------------------------------------------- | -------------: |
| src/modules/academic/academic.controller.ts                           |             54 |
| src/modules/auth/auth.controller.ts                                   |              7 |
| src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts |             12 |
| src/modules/directory/directory.controller.ts                         |             12 |
| src/modules/health/health.controller.ts                               |              3 |
| src/modules/registration-flow/registration-flow.controller.ts         |             28 |

## academic.controller.ts

| Method | URL đầy đủ                                          | Vị trí khai báo                                                                                                            |
| ------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| POST   | /api/v1/academic/programs                           | [src/modules/academic/academic.controller.ts:68](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L68)   |
| PATCH  | /api/v1/academic/assignments/:id                    | [src/modules/academic/academic.controller.ts:73](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L73)   |
| POST   | /api/v1/academic/lessons/:id/revisions              | [src/modules/academic/academic.controller.ts:81](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L81)   |
| GET    | /api/v1/academic/enrollments                        | [src/modules/academic/academic.controller.ts:88](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L88)   |
| GET    | /api/v1/academic/sessions/:id/roster                | [src/modules/academic/academic.controller.ts:94](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L94)   |
| GET    | /api/v1/academic/makeups                            | [src/modules/academic/academic.controller.ts:101](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L101) |
| POST   | /api/v1/academic/assignments/:id/reopen             | [src/modules/academic/academic.controller.ts:107](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L107) |
| GET    | /api/v1/academic/programs                           | [src/modules/academic/academic.controller.ts:114](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L114) |
| POST   | /api/v1/academic/classes                            | [src/modules/academic/academic.controller.ts:120](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L120) |
| GET    | /api/v1/academic/classes                            | [src/modules/academic/academic.controller.ts:126](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L126) |
| POST   | /api/v1/academic/lessons                            | [src/modules/academic/academic.controller.ts:132](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L132) |
| GET    | /api/v1/academic/lessons                            | [src/modules/academic/academic.controller.ts:138](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L138) |
| POST   | /api/v1/academic/lessons/:id/approve                | [src/modules/academic/academic.controller.ts:144](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L144) |
| POST   | /api/v1/academic/lessons/:id/feedback               | [src/modules/academic/academic.controller.ts:150](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L150) |
| GET    | /api/v1/academic/feedback                           | [src/modules/academic/academic.controller.ts:157](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L157) |
| POST   | /api/v1/academic/feedback/:id/resolve               | [src/modules/academic/academic.controller.ts:163](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L163) |
| POST   | /api/v1/academic/sessions                           | [src/modules/academic/academic.controller.ts:170](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L170) |
| GET    | /api/v1/academic/sessions                           | [src/modules/academic/academic.controller.ts:176](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L176) |
| POST   | /api/v1/academic/sessions/:id/roster                | [src/modules/academic/academic.controller.ts:182](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L182) |
| POST   | /api/v1/academic/sessions/:id/finalize-attendance   | [src/modules/academic/academic.controller.ts:188](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L188) |
| POST   | /api/v1/academic/leaves                             | [src/modules/academic/academic.controller.ts:195](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L195) |
| GET    | /api/v1/academic/leaves                             | [src/modules/academic/academic.controller.ts:201](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L201) |
| GET    | /api/v1/academic/makeup-sources                     | [src/modules/academic/academic.controller.ts:207](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L207) |
| POST   | /api/v1/academic/leaves/:id/decide                  | [src/modules/academic/academic.controller.ts:213](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L213) |
| POST   | /api/v1/academic/leaves/:id/cancel                  | [src/modules/academic/academic.controller.ts:220](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L220) |
| GET    | /api/v1/academic/participants/:id/makeup-candidates | [src/modules/academic/academic.controller.ts:226](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L226) |
| POST   | /api/v1/academic/makeups                            | [src/modules/academic/academic.controller.ts:233](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L233) |
| POST   | /api/v1/academic/makeups/:id/cancel                 | [src/modules/academic/academic.controller.ts:239](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L239) |
| POST   | /api/v1/academic/enrollments/:id/transfer           | [src/modules/academic/academic.controller.ts:245](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L245) |
| POST   | /api/v1/academic/enrollments/:id/end                | [src/modules/academic/academic.controller.ts:252](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L252) |
| POST   | /api/v1/academic/students/:id/end-study             | [src/modules/academic/academic.controller.ts:258](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L258) |
| POST   | /api/v1/academic/assignments                        | [src/modules/academic/academic.controller.ts:264](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L264) |
| GET    | /api/v1/academic/assignments                        | [src/modules/academic/academic.controller.ts:270](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L270) |
| GET    | /api/v1/academic/assignments/:id                    | [src/modules/academic/academic.controller.ts:276](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L276) |
| POST   | /api/v1/academic/assignments/:id/publish            | [src/modules/academic/academic.controller.ts:282](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L282) |
| POST   | /api/v1/academic/assignments/:id/close              | [src/modules/academic/academic.controller.ts:289](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L289) |
| POST   | /api/v1/academic/assignments/:id/publish-answers    | [src/modules/academic/academic.controller.ts:295](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L295) |
| GET    | /api/v1/academic/assignments/:id/submissions        | [src/modules/academic/academic.controller.ts:301](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L301) |
| POST   | /api/v1/academic/submissions                        | [src/modules/academic/academic.controller.ts:308](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L308) |
| POST   | /api/v1/academic/submissions/:id/grades             | [src/modules/academic/academic.controller.ts:314](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L314) |
| POST   | /api/v1/academic/submissions/:id/grade-objective    | [src/modules/academic/academic.controller.ts:321](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L321) |
| POST   | /api/v1/academic/submissions/:id/grade-ai           | [src/modules/academic/academic.controller.ts:327](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L327) |
| GET    | /api/v1/academic/grading-jobs/:id                   | [src/modules/academic/academic.controller.ts:333](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L333) |
| POST   | /api/v1/academic/grades/:id/approve                 | [src/modules/academic/academic.controller.ts:339](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L339) |
| POST   | /api/v1/academic/grades/:id/publish                 | [src/modules/academic/academic.controller.ts:345](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L345) |
| POST   | /api/v1/academic/reports                            | [src/modules/academic/academic.controller.ts:351](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L351) |
| GET    | /api/v1/academic/reports                            | [src/modules/academic/academic.controller.ts:357](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L357) |
| GET    | /api/v1/academic/reports/:id/download               | [src/modules/academic/academic.controller.ts:363](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L363) |
| POST   | /api/v1/academic/files                              | [src/modules/academic/academic.controller.ts:372](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L372) |
| GET    | /api/v1/academic/files/:id/download                 | [src/modules/academic/academic.controller.ts:390](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L390) |
| POST   | /api/v1/academic/announcements                      | [src/modules/academic/academic.controller.ts:396](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L396) |
| GET    | /api/v1/academic/announcements                      | [src/modules/academic/academic.controller.ts:402](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L402) |
| POST   | /api/v1/academic/announcements/:id/send-email       | [src/modules/academic/academic.controller.ts:408](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L408) |
| POST   | /api/v1/academic/tuition-reminders/send-email       | [src/modules/academic/academic.controller.ts:414](../../WDP301-BE-System/src/modules/academic/academic.controller.ts#L414) |

## auth.controller.ts

| Method | URL đầy đủ                       | Vị trí khai báo                                                                                            |
| ------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| POST   | /api/v1/auth/register            | [src/modules/auth/auth.controller.ts:37](../../WDP301-BE-System/src/modules/auth/auth.controller.ts#L37)   |
| POST   | /api/v1/auth/login               | [src/modules/auth/auth.controller.ts:59](../../WDP301-BE-System/src/modules/auth/auth.controller.ts#L59)   |
| POST   | /api/v1/auth/refresh             | [src/modules/auth/auth.controller.ts:82](../../WDP301-BE-System/src/modules/auth/auth.controller.ts#L82)   |
| POST   | /api/v1/auth/verify-email        | [src/modules/auth/auth.controller.ts:105](../../WDP301-BE-System/src/modules/auth/auth.controller.ts#L105) |
| POST   | /api/v1/auth/resend-verification | [src/modules/auth/auth.controller.ts:115](../../WDP301-BE-System/src/modules/auth/auth.controller.ts#L115) |
| POST   | /api/v1/auth/logout              | [src/modules/auth/auth.controller.ts:124](../../WDP301-BE-System/src/modules/auth/auth.controller.ts#L124) |
| GET    | /api/v1/auth/me                  | [src/modules/auth/auth.controller.ts:143](../../WDP301-BE-System/src/modules/auth/auth.controller.ts#L143) |

## curriculum-scheduling.controller.ts

| Method | URL đầy đủ                                              | Vị trí khai báo                                                                                                                                                                |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST   | /api/v1/academic/curriculum-units                       | [src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts:34](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts#L34)   |
| GET    | /api/v1/academic/curriculum-units                       | [src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts:43](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts#L43)   |
| GET    | /api/v1/academic/curriculum-units/:id                   | [src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts:52](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts#L52)   |
| PATCH  | /api/v1/academic/curriculum-units/:id                   | [src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts:58](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts#L58)   |
| POST   | /api/v1/academic/curriculum-units/:id/lessons           | [src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts:68](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts#L68)   |
| PATCH  | /api/v1/academic/curriculum-units/:id/lessons/:lessonId | [src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts:78](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts#L78)   |
| POST   | /api/v1/academic/curriculum-units/:id/monthly-tests     | [src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts:89](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts#L89)   |
| POST   | /api/v1/academic/curriculum-units/:id/approve           | [src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts:99](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts#L99)   |
| POST   | /api/v1/academic/curriculum-units/:id/revisions         | [src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts:105](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts#L105) |
| POST   | /api/v1/academic/classes/:id/session-preview            | [src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts:111](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts#L111) |
| POST   | /api/v1/academic/classes/:id/session-generations        | [src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts:121](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts#L121) |
| GET    | /api/v1/academic/scheduled-sessions                     | [src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts:132](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.controller.ts#L132) |

## directory.controller.ts

| Method | URL đầy đủ           | Vị trí khai báo                                                                                                                |
| ------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| GET    | /api/v1/staff        | [src/modules/directory/directory.controller.ts:21](../../WDP301-BE-System/src/modules/directory/directory.controller.ts#L21)   |
| POST   | /api/v1/staff        | [src/modules/directory/directory.controller.ts:30](../../WDP301-BE-System/src/modules/directory/directory.controller.ts#L30)   |
| GET    | /api/v1/staff/:id    | [src/modules/directory/directory.controller.ts:39](../../WDP301-BE-System/src/modules/directory/directory.controller.ts#L39)   |
| PATCH  | /api/v1/staff/:id    | [src/modules/directory/directory.controller.ts:45](../../WDP301-BE-System/src/modules/directory/directory.controller.ts#L45)   |
| GET    | /api/v1/teachers     | [src/modules/directory/directory.controller.ts:57](../../WDP301-BE-System/src/modules/directory/directory.controller.ts#L57)   |
| POST   | /api/v1/teachers     | [src/modules/directory/directory.controller.ts:66](../../WDP301-BE-System/src/modules/directory/directory.controller.ts#L66)   |
| GET    | /api/v1/teachers/:id | [src/modules/directory/directory.controller.ts:75](../../WDP301-BE-System/src/modules/directory/directory.controller.ts#L75)   |
| PATCH  | /api/v1/teachers/:id | [src/modules/directory/directory.controller.ts:81](../../WDP301-BE-System/src/modules/directory/directory.controller.ts#L81)   |
| GET    | /api/v1/parents      | [src/modules/directory/directory.controller.ts:93](../../WDP301-BE-System/src/modules/directory/directory.controller.ts#L93)   |
| GET    | /api/v1/parents/:id  | [src/modules/directory/directory.controller.ts:102](../../WDP301-BE-System/src/modules/directory/directory.controller.ts#L102) |
| PATCH  | /api/v1/parents/:id  | [src/modules/directory/directory.controller.ts:108](../../WDP301-BE-System/src/modules/directory/directory.controller.ts#L108) |
| GET    | /api/v1/dashboard    | [src/modules/directory/directory.controller.ts:118](../../WDP301-BE-System/src/modules/directory/directory.controller.ts#L118) |

## health.controller.ts

| Method | URL đầy đủ           | Vị trí khai báo                                                                                                  |
| ------ | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| GET    | /api/v1/health       | [src/modules/health/health.controller.ts:18](../../WDP301-BE-System/src/modules/health/health.controller.ts#L18) |
| GET    | /api/v1/health/live  | [src/modules/health/health.controller.ts:26](../../WDP301-BE-System/src/modules/health/health.controller.ts#L26) |
| GET    | /api/v1/health/ready | [src/modules/health/health.controller.ts:33](../../WDP301-BE-System/src/modules/health/health.controller.ts#L33) |

## registration-flow.controller.ts

| Method | URL đầy đủ                                | Vị trí khai báo                                                                                                                                                |
| ------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | /api/v1/me/bills                          | [src/modules/registration-flow/registration-flow.controller.ts:39](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L39)   |
| GET    | /api/v1/me/students                       | [src/modules/registration-flow/registration-flow.controller.ts:62](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L62)   |
| POST   | /api/v1/me/students                       | [src/modules/registration-flow/registration-flow.controller.ts:68](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L68)   |
| PATCH  | /api/v1/me/students/:id                   | [src/modules/registration-flow/registration-flow.controller.ts:77](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L77)   |
| GET    | /api/v1/me/students/:id/enrollments       | [src/modules/registration-flow/registration-flow.controller.ts:87](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L87)   |
| GET    | /api/v1/me/students/:id/schedule          | [src/modules/registration-flow/registration-flow.controller.ts:96](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L96)   |
| GET    | /api/v1/students                          | [src/modules/registration-flow/registration-flow.controller.ts:105](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L105) |
| GET    | /api/v1/students/:id/enrollments          | [src/modules/registration-flow/registration-flow.controller.ts:114](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L114) |
| GET    | /api/v1/students/:id/schedule             | [src/modules/registration-flow/registration-flow.controller.ts:123](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L123) |
| GET    | /api/v1/parents/lookup                    | [src/modules/registration-flow/registration-flow.controller.ts:132](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L132) |
| GET    | /api/v1/parents/search                    | [src/modules/registration-flow/registration-flow.controller.ts:141](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L141) |
| POST   | /api/v1/programs                          | [src/modules/registration-flow/registration-flow.controller.ts:171](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L171) |
| GET    | /api/v1/programs                          | [src/modules/registration-flow/registration-flow.controller.ts:180](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L180) |
| PATCH  | /api/v1/programs/:id                      | [src/modules/registration-flow/registration-flow.controller.ts:186](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L186) |
| DELETE | /api/v1/programs/:id                      | [src/modules/registration-flow/registration-flow.controller.ts:196](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L196) |
| POST   | /api/v1/classes                           | [src/modules/registration-flow/registration-flow.controller.ts:202](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L202) |
| PATCH  | /api/v1/classes/:id                       | [src/modules/registration-flow/registration-flow.controller.ts:208](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L208) |
| GET    | /api/v1/classes                           | [src/modules/registration-flow/registration-flow.controller.ts:218](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L218) |
| GET    | /api/v1/classes/:id                       | [src/modules/registration-flow/registration-flow.controller.ts:227](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L227) |
| POST   | /api/v1/classes/:id/schedules             | [src/modules/registration-flow/registration-flow.controller.ts:237](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L237) |
| POST   | /api/v1/registrations                     | [src/modules/registration-flow/registration-flow.controller.ts:247](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L247) |
| GET    | /api/v1/registrations                     | [src/modules/registration-flow/registration-flow.controller.ts:259](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L259) |
| GET    | /api/v1/payments                          | [src/modules/registration-flow/registration-flow.controller.ts:268](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L268) |
| GET    | /api/v1/registrations/:id                 | [src/modules/registration-flow/registration-flow.controller.ts:277](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L277) |
| GET    | /api/v1/registrations/:id/bill            | [src/modules/registration-flow/registration-flow.controller.ts:283](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L283) |
| POST   | /api/v1/registrations/:id/cancel          | [src/modules/registration-flow/registration-flow.controller.ts:316](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L316) |
| POST   | /api/v1/registrations/:id/confirm-payment | [src/modules/registration-flow/registration-flow.controller.ts:325](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L325) |
| GET    | /api/v1/registrations/:id/receipt         | [src/modules/registration-flow/registration-flow.controller.ts:336](../../WDP301-BE-System/src/modules/registration-flow/registration-flow.controller.ts#L336) |

## Cách sử dụng khi chia việc

- Có route ở đây nhưng UI dùng mock: bắt đầu bằng đối chiếu DTO/response/quyền và wire client, không yêu cầu BE tạo lại nguyên module.
- Field/filter hoặc hành vi chưa đáp ứng UI: tạo ticket bổ sung contract theo ID trong tài liệu yêu cầu.
- Route mới trong tài liệu yêu cầu không có ở đây: tên URL là đề xuất để nhóm BE thống nhất.
- Link source tương đối dùng khi ba repo nằm cạnh nhau; khi gửi một file riêng, vẫn đọc được đường dẫn và số dòng trong nhãn.
