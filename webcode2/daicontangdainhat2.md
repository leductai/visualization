# ROOKIE TRAINING SPRING 2023 - LIS

Cho số nguyên dương $n$ và dãy số $A$ có $n$ số nguyên $a_1, a_2, \dots, a_n$. Hãy tìm dãy con tăng dài nhất của $A$.

Định nghĩa dãy $B$ được gọi là dãy con tăng độ dài $K$ của dãy $A$ nếu thỏa các điều kiện sau:
* $K \ge 1$.
* $1 \le i_1 < i_2 < \dots < i_K \le n$.
* $B_1 = a_{i_1}, B_2 = a_{i_2}, \dots, B_K = a_{i_K}$.
* $B_1 < B_2 < \dots < B_K$ nếu $K \ge 2$.

## Dữ liệu vào:
Gồm 2 dòng:
* Dòng đầu tiên chứa số nguyên dương $n$.
* Dòng thứ hai chứa $n$ số nguyên $a_1, a_2, \dots, a_n$.

## Kết quả:
Gồm 2 dòng:
* Dòng đầu tiên in ra số nguyên dương $K$ là độ dài dãy con tăng dài nhất của dãy $A$.
* Dòng thứ hai in ra $K$ số nguyên $B_1, B_2, \dots, B_K$ là dãy con tăng dài nhất của dãy $A$. Nếu có nhiều dãy con tăng dài nhất thỏa mãn, in ra một dãy con tăng dài nhất thỏa mãn bất kì.

## Ràng buộc:
* $1 \le n \le 5 \cdot 10^3$
* $-10^9 \le a_i \le 10^9$

## Ví dụ:

| Input | Output |
| :--- | :--- |
| 5<br>2 4 3 1 5 | 3<br>2 4 5 |