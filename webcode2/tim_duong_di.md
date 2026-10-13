# VÍ DỤ 5: TÌM TẤT CẢ ĐƯỜNG ĐI TỪ U ĐẾN I

Cho đồ thị có hướng gồm \(n\) đỉnh, mỗi đỉnh có một nhãn. Hãy liệt kê tất cả các đường đi đơn (không thăm lại đỉnh nào) từ đỉnh bắt đầu đến đỉnh kết thúc bằng thuật toán quay lui: thử mọi cạnh ra tới đỉnh chưa thăm, đánh dấu, đi sâu rồi hoàn tác.

## Input:

* Dòng đầu tiên chứa hai số nguyên \(n\) và \(m\): số đỉnh và số cạnh có hướng (\(1 \le n \le 50\), \(0 \le m \le 500\)).
* Dòng thứ hai chứa \(n\) nhãn đỉnh phân biệt.
* \(m\) dòng tiếp theo, mỗi dòng chứa một cạnh có hướng \(a_i\) \(b_i\).
* Dòng cuối cùng chứa hai nhãn: đỉnh bắt đầu và đỉnh kết thúc (mở rộng từ mẫu trên lớp, vốn ngầm hiểu đi từ U đến I).

## Output:

Mỗi dòng là một đường đi từ đỉnh bắt đầu đến đỉnh kết thúc, các nhãn cách nhau bởi `->`. Nếu không có đường đi nào thì không in gì cả.

## Example:

| Input | Output |
| :--- | :--- |
| 6 13<br>W K I U M Q<br>W M<br>W Q<br>I W<br>I K<br>I U<br>I M<br>U W<br>U K<br>U Q<br>M U<br>M Q<br>Q I<br>Q M<br>U I | U -> W -> M -> Q -> I<br>U -> W -> Q -> I<br>U -> Q -> I |
