#include <bits/stdc++.h>
using namespace std;
int L, h;
int vach[2005];
void ve(int l, int r, int h) {
    if (h <= 0) return;
    if (r - l <= 1) return;
    int m = (l + r) / 2;
    vach[m] = h;
    ve(l, m, h - 1);
    ve(m, r, h - 1);
}
int main() {
    cin >> L >> h;
    ve(0, L, h);
    for (int i = 1; i < L; i++) if (vach[i]) cout << i << ':' << vach[i] << '\n';
    return 0;
}
