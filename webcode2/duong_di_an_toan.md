# ĐƯỜNG ĐI AN TOÀN

Ai trong chúng ta ít nhất một lần trong đời cũng bị cảnh sát giao thông thổi (chưa bị cũng sẽ bị), không vì vượt đèn đỏ thì cũng chạy lấn làn. Tấn Lưu với kinh nghiệm đã từng "tống ba" không đội mũ bảo hiểm và bị phạt 200k, nay lại quyết định tiếp tục chở ba nhưng có đội mũ bảo hiểm từ Ký túc xá khu B về đến trường UIT. Tuy nhiên, anh ấy rất sợ bị cảnh sát giao thông thổi phạt nên với quan hệ rộng rãi của mình, anh ấy đã xin được bản đồ mô tả Làng đại học cùng các chốt chặn của cảnh sát giao thông ngày hôm đó.

Bản đồ có kích thước \(n \times n\), mỗi điểm trên bản đồ tương ứng với một ô tọa độ. Có thể sẽ có chốt chặn cảnh sát giao thông đứng tại một số ô nhất định:
- Ký túc xá khu B nằm ở góc trên bên trái bản đồ (tọa độ \([1, 1]\)).
- Trường UIT nằm ở góc dưới bên phải bản đồ (tọa độ \([n, n]\)).
- Tấn Lưu xuất phát từ Ký túc xá khu B đến UIT và **chỉ được phép di chuyển sang phải hoặc đi xuống dưới**.

Tấn Lưu muốn tìm số lượng các con đường đi an toàn từ KTX khu B đến UIT. Một con đường đi an toàn là con đường không đi qua bất kỳ chốt chặn nào của cảnh sát giao thông.

## Input

- Dòng đầu tiên chứa số nguyên dương \(n\) (\(1 \le n \le 1000\)).
- \(n\) dòng tiếp theo mô tả bản đồ:
  - Ký tự `.` mô tả một ô trống an toàn có thể đi vào.
  - Ký tự `*` mô tả chốt chặn của cảnh sát giao thông (không thể đi vào).

## Output

- In ra một dòng duy nhất chứa kết quả là số lượng đường đi an toàn lấy phần dư cho \(10^9 + 7\) (do số lượng đường đi có thể rất lớn).

## Ràng buộc

- \(1 \le n \le 1000\)
- Thời gian chạy tiêu chuẩn: \(1.0\text{s}\)
- Bộ nhớ tiêu chuẩn: \(256\text{ MB}\)

## Ví dụ

### Ví dụ 1

#### Input
```text
4
....
.*..
...*
*...
```

#### Output
```text
3
```

#### Giải thích
Có 3 đường đi an toàn từ ô \((1, 1)\) đến ô \((4, 4)\) không chạm vào bất kỳ chốt `*` nào:
1. Xuống \(\to\) Phải \(\to\) Phải \(\to\) Xuống \(\to\) Xuống \(\to\) Phải
2. Phải \(\to\) Phải \(\to\) Xuống \(\to\) Xuống \(\to\) Phải \(\to\) Xuống
3. Phải \(\to\) Phải \(\to\) Phải \(\to\) Xuống \(\to\) Xuống \(\to\) Xuống

---

### Ví dụ 2

#### Input
```text
10
.*......*.
..*....*..
.......*..
...*.*....
....*.....
..*..*....
..*.......
....*..*..
*........*
....*.....
```

#### Output
```text
344
```
