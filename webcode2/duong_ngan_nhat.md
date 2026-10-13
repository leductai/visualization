# ĐƯỜNG ĐI NGẮN NHẤT (DIJKSTRA)

Cho đồ thị có hướng gồm \(n\) đỉnh và \(m\) cạnh, mỗi cạnh có trọng số KHÔNG ÂM. Hãy tìm đường đi ngắn nhất từ đỉnh bắt đầu đến đỉnh kết thúc bằng thuật toán tham lam Dijkstra: lặp lại việc chốt đỉnh chưa xong có khoảng cách tạm nhỏ nhất, rồi nới lỏng mọi cạnh đi ra khỏi nó.

## Input:

* Dòng đầu tiên chứa hai số nguyên \(n\) và \(m\) (\(1 \le n \le 50\), \(0 \le m \le 500\)).
* Dòng thứ hai chứa \(n\) nhãn đỉnh phân biệt.
* \(m\) dòng tiếp theo, mỗi dòng chứa một cạnh có hướng \(a_i\) \(b_i\) \(w_i\) với \(w_i \ge 0\).
* Dòng cuối cùng chứa hai nhãn: đỉnh bắt đầu và đỉnh kết thúc.

## Output:

* Nếu tới được: dòng đầu là đường đi (các nhãn cách nhau bởi `->`), dòng sau là hàng khoảng cách từ đỉnh bắt đầu (`-1` nghĩa là không tới được).
* Nếu không tới được đỉnh kết thúc: chỉ in hàng khoảng cách.

## Example:

| Input | Output |
| :--- | :--- |
| 6 10<br>A B C D E F<br>A B 4<br>A C 2<br>B C 1<br>C B 1<br>B D 5<br>C D 8<br>C E 10<br>D E 2<br>D F 6<br>E F 3<br>A F | A -> C -> B -> D -> E -> F<br>0 3 2 8 10 13 |
