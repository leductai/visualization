# ĐỒ ÁN

Có \(n\) đồ án mà Phúc có thể tham gia. Với mỗi đồ án thì chúng ta biết được ngày bắt đầu, ngày kết thúc và lượng tín chỉ nhận được khi hoàn thành đồ án đó. Mỗi ngày, Phúc chỉ có thể thực hiện được duy nhất một đồ án thôi, nếu không thì sẽ bị deadlines dí mất >.< nên đừng có tham lam.

Là một người muốn ra trường càng sớm càng tốt ^^, hãy giúp Phúc tính số lượng tín chỉ lớn nhất mà Phúc có thể nhận được.

## Input

- Dòng đầu tiên chứa số nguyên dương \(n\): số lượng các đồ án.
- \(n\) dòng tiếp theo: Mỗi dòng chứa 3 số nguyên dương \(a_i, b_i, p_i\) tương ứng với ngày bắt đầu, ngày kết thúc và số lượng tín chỉ nhận được khi hoàn thành đồ án đó.

## Output

- Dòng duy nhất chứa kết quả là số lượng tín chỉ lớn nhất Phúc đạt được.

## Ràng buộc

- \(1 \le n \le 2 \times 10^5\)
- \(1 \le a_i \le b_i \le 10^9\)
- \(1 \le p_i \le 10^9\)

## Ví dụ

### Input
```text
4
2 4 4
3 6 6
6 8 2
5 7 3
```

### Output
```text
7
```

### Giải thích
Chọn đồ án thứ nhất (\(a_1 = 2, b_1 = 4, p_1 = 4\)) và đồ án thứ tư (\(a_4 = 5, b_4 = 7, p_4 = 3\)). Hai khoảng thời gian \([2, 4]\) và \([5, 7]\) không giao nhau, tổng số tín chỉ đạt được là:

\[
4 + 3 = 7
\]
