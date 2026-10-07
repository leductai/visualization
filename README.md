# Algo Studio

Ứng dụng React + TypeScript + Vite trực quan hóa 16 thuật toán từ `webcode/` và `webcode2/`. Mã C++ được nhập nguyên bản để tham khảo; bộ mô phỏng TypeScript chạy trong Web Worker.

## Chạy ứng dụng

```sh
npm install
npm run dev
```

Mở địa chỉ Vite in ra, mặc định `http://localhost:5173`. Có thể mở trực tiếp một bài bằng hash, ví dụ `/#sudoku`.

## Kiểm tra

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Kiểm thử trình duyệt dùng Chromium ở kích thước desktop và mobile, bao gồm navigation, Worker, phát/dừng, lịch sử, dòng mã đang chạy, IndexedDB không khả dụng và accessibility bằng axe. Ảnh chụp được lưu trong `test-results/`.

## Cấu trúc

- `src/algorithms/`: registry, bộ mô phỏng thuần TypeScript, nội dung bài và ánh xạ sự kiện với C++/giả mã.
- `src/worker/`: tạo sự kiện theo yêu cầu; hủy ngay bằng cách terminate Worker.
- `src/engine/`: phát lại và lưu lịch sử từng phiên bằng IndexedDB.
- `src/components/`: trực quan lưới, mảng, cây LCA, khoảng thời gian và danh sách kết quả ảo hóa.
- `src/i18n/`: nhãn dùng chung bằng tiếng Việt.

Lịch sử giữ toàn bộ các bước đã xem trong phiên; reset/chuyển bài giải phóng dữ liệu phiên đó. Khi IndexedDB không dùng được, bộ nhớ dự phòng giữ tối đa 2.000 bước rồi dừng có cảnh báo, không tự xóa lịch sử. Khi IndexedDB hết dung lượng, ứng dụng cũng dừng và giữ các bước đã lưu. Không đặt trần số bước cho mô phỏng khi IndexedDB hoạt động.

## Khác biệt được ghi rõ so với C++

- Dò mìn: sửa truy cập `b[-1]` khi suy ra hàng thứ hai thành hàng 0 ảo. Giữ nghiệm đầu tiên được in, tránh thay đổi hàng đầu khi thoát đệ quy.
- Sudoku: kiểm tra số cho sẵn và báo vô nghiệm; mã gốc chỉ in bảng sau lời gọi quay lui.
- Điểm môn học: dùng hệ số phần trăm có tổng 100 và khoảng làm tròn đúng mã gốc.
- Hoán vị chữ số: giữ nguyên việc C++ chỉ chọn 9..1, nên đầu vào có 0 không cho kết quả.
- Đồ án: giữ điều kiện `end < start`; LIS giữ so sánh tăng nghiêm ngặt và thứ tự truy vết của C++.
- Khoảng cách chỉnh sửa và phân hoạch palindrome có mẫu chuỗi rỗng như một mở rộng có ghi chú.

MVP chỉ dùng đầu vào mẫu được kiểm tra. Không thực thi C++ tùy ý, không có backend hoặc tài khoản.
