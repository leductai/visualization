# Quy hoạch tuyến tính

Trong mặt phẳng tọa độ \(Oxy\), cho một hàm mục tiêu tuyến tính hai biến \(Z = c_1 x + c_2 y\) và một hệ gồm \(m\) ràng buộc tuyến tính dạng \(ax + by \le c\), \(ax + by \ge c\) hoặc \(ax + by = c\).

Miền nghiệm của bài toán là tập hợp tất cả các điểm \((x, y)\) thỏa mãn đồng thời mọi ràng buộc. Hãy tìm điểm trong miền nghiệm làm cho \(Z\) đạt giá trị lớn nhất (nếu bài toán yêu cầu cực đại) hoặc nhỏ nhất (nếu yêu cầu cực tiểu).

Yêu cầu: giải bằng phương pháp đồ thị. Miền nghiệm của một hệ bất phương trình tuyến tính hai biến là một đa giác lồi, và hàm tuyến tính luôn đạt cực trị tại một đỉnh của đa giác đó. Vì vậy chỉ cần xác định các đỉnh rồi tính \(Z\) tại từng đỉnh.

## Input

- Dòng đầu tiên gồm từ khóa `max` hoặc `min` và hàm mục tiêu, ví dụ `max 3x + 2y`.
- \(m\) dòng tiếp theo, mỗi dòng là một ràng buộc, ví dụ `2x + y <= 10`.

## Output

- In ra tọa độ điểm tối ưu và giá trị \(Z\) tại điểm đó.
- Nếu miền nghiệm rỗng, in ra `vo_nghiem`.
- Nếu miền nghiệm khác rỗng nhưng \(Z\) không bị chặn, in ra thông báo không giới nội.

## Ràng buộc

- \(1 \le m \le 12\)
- Hệ số của \(x\) và \(y\) trong mỗi ràng buộc không đồng thời bằng 0.
- Các hệ số là số thực, giá trị tuyệt đối không vượt quá \(10^6\); vế phải không vượt quá \(10^9\) về giá trị tuyệt đối.

## Ví dụ

### Input
```text
max 3x + 2y
2x + y <= 10
x + 2y <= 8
x >= 0
y >= 0
```

### Output
```text
x = 4, y = 2, Z = 16
```

### Giải thích
Bốn ràng buộc giới hạn miền nghiệm thành một tứ giác lồi. Giao điểm của hai đường \(2x + y = 10\) và \(x + 2y = 8\) là điểm \((4, 2)\). Tính \(Z\) tại bốn đỉnh của miền nghiệm: tại \((0, 0)\) được 0, tại \((5, 0)\) được 15, tại \((0, 4)\) được 8, tại \((4, 2)\) được \(3 \times 4 + 2 \times 2 = 16\). Giá trị lớn nhất là 16, đạt tại đỉnh \((4, 2)\).
