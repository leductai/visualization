# Cây khung nhỏ nhất

Cho một đồ thị vô hướng có \(n\) đỉnh và \(m\) cạnh, mỗi cạnh có một trọng số nguyên dương. Một cây khung của đồ thị là một tập hợp gồm đúng \(n - 1\) cạnh, không tạo thành chu trình và nối tất cả các đỉnh lại với nhau.

Hãy tìm cây khung có tổng trọng số các cạnh nhỏ nhất. Nếu đồ thị không liên thông thì không tồn tại cây khung.

Yêu cầu: dù có nhiều cách giải, bài này phải giải bằng kỹ thuật quay lui, duyệt lần lượt từng cạnh và quyết định chọn hoặc bỏ cạnh đó.

## Input

- Dòng đầu tiên gồm hai số nguyên \(n\) và \(m\) lần lượt là số đỉnh và số cạnh của đồ thị.
- \(m\) dòng tiếp theo, mỗi dòng gồm ba số nguyên \(u, v, w\) mô tả một cạnh nối hai đỉnh \(u\) và \(v\) với trọng số \(w\).

## Output

- In ra một số nguyên duy nhất là tổng trọng số nhỏ nhất của cây khung.
- Nếu đồ thị không liên thông, in ra `vo_nghiem`.

## Ràng buộc

- \(2 \le n \le 10\)
- \(1 \le m \le 20\)
- \(1 \le u, v \le n\), \(u \ne v\)
- \(1 \le w \le 10^6\)

## Ví dụ

### Input
```text
3 3
1 2 1
2 3 2
1 3 4
```

### Output
```text
3
```

### Giải thích
Ba cạnh tạo thành một tam giác. Cây khung cần đúng \(n - 1 = 2\) cạnh. Cách chọn tốt nhất là lấy cạnh \((1,2)\) trọng số 1 và cạnh \((2,3)\) trọng số 2, tổng bằng 3. Nếu chọn cạnh \((1,3)\) trọng số 4 thì tổng lớn hơn, không phải nghiệm tối ưu.
