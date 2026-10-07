# RÚT BÀI TRÚNG THƯỞNG

Lưu Ngô và Thắng Trương tham gia một trò chơi bốc bài trúng thưởng lớn, luật chơi như sau: Hai người ở hai căn phòng riêng biệt; Lưu Ngô rút \(n\) lá bài, Thắng Trương rút \(m\) lá bài (với mỗi lá bài là một ký tự in hoa từ `A` đến `Z`). Sau khi cả hai rút xong, nếu chuỗi lá bài của hai người trùng khớp hoàn toàn với nhau thì họ sẽ nhận được phần thưởng lớn.

Ví dụ:
- Thắng Trương và Lưu Ngô **sẽ nhận được** phần thưởng nếu kết quả rút bài là:
  - `ABCDEF` và `ABCDEF`
  - `TTT` và `TTT`
- Cả hai **sẽ không nhận được** phần thưởng nếu kết quả rút bài là:
  - `ABCDEF` và `ABCDE`
  - `TAT` và `TBT`

Hiểu được tính chất phức tạp của trò chơi và việc tự nhiên trùng khớp là rất khó, Phúc Nguyễn quyết định bày mưu tính kế giúp cả hai giành chiến thắng. Sau khi cả hai rút bài xong, Phúc Nguyễn đem chuỗi lá bài của người này đưa cho người kia để họ chỉnh sửa chuỗi bài đã chọn sao cho hai chuỗi trùng khớp với nhau.

Các hành động chỉnh sửa hợp lệ gồm:
- Thêm một lá bài vào chuỗi lá bài đã bốc.
- Bỏ một lá bài ra khỏi chuỗi lá bài đã bốc.
- Thay thế một lá bài thành một lá bài khác trong chuỗi đã bốc.

Vì thời gian có hạn, cả hai đều muốn thực hiện nhanh nhất có thể (sử dụng số lượng hành động ít nhất). Hãy tìm số hành động tối thiểu để một trong hai người có thể biến đổi chuỗi bài của mình thành chuỗi bài của người kia.

## Input

- Dòng đầu tiên chứa một chuỗi gồm \(n\) ký tự in hoa (`A` – `Z`).
- Dòng thứ hai chứa một chuỗi gồm \(m\) ký tự in hoa (`A` – `Z`).

## Output

- In ra một dòng duy nhất chứa một số nguyên là số hành động tối thiểu cần thực hiện.

## Ràng buộc

- \(1 \le n, m \le 5000\)

## Ví dụ

### Input
```text
LOVE
MOVIE
```

### Output
```text
2
```

### Giải thích
- Lưu Ngô bốc chuỗi bài: `L`, `O`, `V`, `E`
- Thắng Trương bốc chuỗi bài: `M`, `O`, `V`, `I`, `E`
- Số thao tác tối thiểu để biến đổi `LOVE` thành `MOVIE` là 2:
  1. Thay thế ký tự `L` thành `M` (\(\text{LOVE} \to \text{MOVE}\)).
  2. Chèn ký tự `I` vào giữa `V` và `E` (\(\text{MOVE} \to \text{MOVIE}\)).
