# DÃY FIBONACCI (ĐỆ QUY TOP-DOWN)

Dãy Fibonacci được định nghĩa truy hồi: \(f(0) = 0\), \(f(1) = 1\) và \(f(n) = f(n - 1) + f(n - 2)\) với mọi \(n \ge 2\). Hãy tính \(f(n)\) bằng đệ quy top-down (chia để trị): mỗi lời gọi tách thành hai lời gọi con, đi sâu tới trường hợp dừng rồi cộng ngược lên.

## Input:

Một số nguyên \(n\) (\(0 \le n \le 20\)).

## Output:

Một dòng duy nhất là \(f(n)\).

## Example:

| Input | Output |
| :--- | :--- |
| 6 | 8 |
| 0 | 0 |
