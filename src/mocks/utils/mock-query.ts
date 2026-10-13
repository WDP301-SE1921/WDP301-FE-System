/**
 * Giai đoạn MOCK-ONLY: chưa có backend thật.
 *
 * Mọi hook TanStack Query dùng `mockQuery`/`mockMutation` làm `queryFn`/`mutationFn`
 * để giả lập độ trễ mạng. Khi backend sẵn sàng, chỉ cần thay hàm truyền vào —
 * chữ ký của hook giữ nguyên.
 */
const MOCK_LATENCY_MS = 600

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Trả về dữ liệu mock sau một khoảng trễ giả lập. */
export async function mockQuery<TData>(
  data: TData | (() => TData),
  latencyMs: number = MOCK_LATENCY_MS
): Promise<TData> {
  await delay(latencyMs)
  return typeof data === "function" ? (data as () => TData)() : data
}

/**
 * Giả lập một mutation: chạy `resolver` sau độ trễ. `resolver` được phép throw
 * `MockError` để mô phỏng lỗi nghiệp vụ trả về từ backend.
 */
export async function mockMutation<TVariables, TData>(
  variables: TVariables,
  resolver: (variables: TVariables) => TData | Promise<TData>,
  latencyMs: number = MOCK_LATENCY_MS
): Promise<TData> {
  await delay(latencyMs)
  return resolver(variables)
}

/** Lỗi nghiệp vụ giả lập, mang sẵn message tiếng Việt lấy từ `src/constants`. */
export class MockError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MockError"
  }
}
