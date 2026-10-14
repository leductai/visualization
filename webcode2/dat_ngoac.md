# ĐẶT NGOẶC TỐI ƯU BIỂU THỨC

Bạn được cho một biểu thức gồm \(n + 1\) số thực \(x_0, x_1, \dots, x_n\) và \(n\) toán tử \(o_0, o_1, \dots, o_{n-1}\), được biểu diễn dưới dạng chuỗi \(x_0o_0x_1x_2 \dots o_{n-1}x_n\). Trong đó, mỗi \(o_i\) là cộng (\(+\)) hoặc nhân (\(×\)). Nhiệm vụ của bạn là xác định cách đặt dấu ngoặc đơn để tối đa hóa giá trị của biểu thức.

* Với biểu thức \(6+0×6\): Sai: \(6+(0×6) = 6+0 = 6\); Đúng: \((6+0)×6 = 6×6 = 36\).
* Với biểu thức \(0.1×0.1+0.1\): Sai: \(0.1×(0.1+0.1) = 0.1×0.2 = 0.02\); Đúng: \((0.1×0.1)+0.1 = 0.01+0.1 = 0.11\).

Ý tưởng giải bài toán trên theo phương pháp Quy hoạch động (Dynamic Programming) như sau: kết quả tối ưu đạt được bằng cách thử tất cả các cách đặt dấu ngoặc hợp lệ. Các bài toán con có dạng: tìm cách đặt dấu ngoặc tối ưu trên đoạn con \(x_io_i \dots o_{j-1}x_j\) với \(0 \le i \le j \le n\). Sử dụng một bảng \(DP[i][j]\) để lưu trữ giá trị lớn nhất có thể đạt được của biểu thức từ \(x_i\) đến \(x_j\).

Ví dụ, cho biểu thức \(1+2×3+4\) với \(x_0 = 1\), \(x_1 = 2\), \(x_2 = 3\), \(x_3 = 4\) và \(o_0 = +\), \(o_1 = ×\), \(o_2 = +\); thì \(DB[0][2] = 9\), vì biểu thức \(1+2×3\) với cách đặt ngoặc \((1+2)×3 = 9\) cho giá trị lớn nhất.

## Input:

Một chuỗi duy nhất là biểu thức (số không âm, phép toán \(+\) hoặc \(×\) xen kẽ).

## Output:

* Dòng đầu là giá trị lớn nhất đạt được.
* Dòng sau là biểu thức tối ưu với đầy đủ dấu ngoặc.

## Example:

| Input | Output |
| :--- | :--- |
| 1+2×3+4 | 21<br>((1 + 2) x (3 + 4)) |
| 6+0×6 | 36<br>((6 + 0) x 6) |
| 0.1×0.1+0.1 | 0.11<br>((0.1 x 0.1) + 0.1) |
