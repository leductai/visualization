#include <iostream>
using namespace std;

int n;
int day[32];

// In ra dãy nhị phân khi cả n vị trí đã được điền.
void inDay() {
    for (int i = 0; i < n; i++) cout << day[i];
    cout << '\n';
}

// Ở mỗi vị trí, thử lần lượt bit 0 rồi bit 1 (vét cạn, không cắt nhánh).
void quayLui(int viTri) {
    if (viTri == n) {
        inDay();
        return;
    }

    for (int bit = 0; bit <= 1; bit++) {
        day[viTri] = bit;
        quayLui(viTri + 1);
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n;
    quayLui(0);
    return 0;
}
