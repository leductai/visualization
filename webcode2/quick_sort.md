# SẮP XẾP NHANH (QUICK SORT)

Cho dãy số nguyên \(a\) gồm \(n\) phần tử. Sắp xếp dãy theo thứ tự tăng dần bằng Quick Sort với phân đoạn Lomuto: chọn chốt là phần tử cuối đoạn, quét để gom các số \( \le \) chốt về đầu đoạn, đặt chốt vào vị trí đúng rồi đệ quy hai bên.

Mỗi lần phân đoạn xong (chốt đã đứng đúng chỗ) thì ghi lại cấu hình dãy hiện hành. Chỉ ghi các lần làm thay đổi dãy; bỏ qua các lần phân đoạn không đổi thứ tự.

## Input:

* Dòng đầu tiên chứa số nguyên \(n\) (\(1 \le n \le 500\)).
* Dòng thứ hai chứa \(n\) số nguyên là các phần tử của dãy.

## Output:

Mỗi dòng là một cấu hình dãy sau một lần phân đoạn làm thay đổi dãy.

## Example:

| Input | Output |
| :--- | :--- |
| 8<br>8 3 4 5 9 1 12 7 | 3 4 5 1 7 8 12 9<br>1 4 5 3 7 8 12 9<br>1 3 5 4 7 8 12 9<br>1 3 4 5 7 8 12 9<br>1 3 4 5 7 8 9 12 |
