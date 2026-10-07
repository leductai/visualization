# Tiệm sách

Bạn đang ở trong một cửa hàng sách bán \(n\) cuốn sách khác nhau. Bạn biết giá và số trang của mỗi cuốn sách.

Bạn đã quyết định rằng tổng giá mua của bạn tối đa là \(x\). Số lượng trang tối đa bạn có thể mua là bao nhiêu? Bạn có thể mua mỗi cuốn nhiều nhất một lần.

## Input

- Dòng đầu tiên gồm hai số nguyên \(n\) và \(x\) lần lượt là số lượng sách và số tiền tối đa mà bạn chi.
- Dòng thứ hai gồm dãy \(n\) số nguyên \(h_1, h_2, \dots, h_n\) là giá trị của mỗi cuốn sách.
- Dòng thứ ba gồm dãy \(n\) số nguyên \(s_1, s_2, \dots, s_n\) là số lượng trang của mỗi cuốn sách.

## Output

- In ra một số nguyên duy nhất là số lượng trang sách tối đa có thể mua được.

## Ràng buộc

- \(1 \le n \le 1000\)
- \(1 \le x \le 10^5\)
- \(1 \le h_i, s_i \le 1000\)

## Ví dụ

### Input
```text
4 10
4 8 5 3
5 12 8 1
```

### Output
```text
13
```

### Giải thích
Bạn có thể chọn mua cuốn sách thứ 1 (giá 4, 5 trang) và cuốn sách thứ 3 (giá 5, 8 trang). Tổng chi phí là \(4 + 5 = 9 \le 10\), tổng số trang nhận được là \(5 + 8 = 13\).
