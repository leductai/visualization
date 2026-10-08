#include <bits/stdc++.h>
using namespace std;
// Phuong phap do thi cho QHTT 2 bien.
// Dau vao la dang CHUAN HOA cua de dai so: sense cx cy / m / a b c
// (sense = 1 max, -1 min; moi rang buoc da dua ve a*x + b*y <= c).
// Giao dien mo phong nhan dang dai so (vd "max 3x + 2y", "2x + y <= 10")
// roi chuan hoa ve dang so nay truoc khi liet ke dinh.
const double EPS = 1e-9;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int sense; // 1 = max, -1 = min
    double cx, cy;
    if (!(cin >> sense >> cx >> cy)) return 0;
    int m;
    cin >> m;
    vector<double> a(m), b(m), c(m);
    for (int i = 0; i < m; i++) cin >> a[i] >> b[i] >> c[i];
    auto thoa = [&](double x, double y) {
        for (int i = 0; i < m; i++)
            if (a[i] * x + b[i] * y > c[i] + 1e-7) return false;
        return true;
    };
    vector<pair<double, double>> dinh;
    for (int i = 0; i < m; i++) for (int j = i + 1; j < m; j++) {
        double dinhThuc = a[i] * b[j] - a[j] * b[i];
        if (fabs(dinhThuc) < EPS) continue; // hai duong song song
        double x = (c[i] * b[j] - c[j] * b[i]) / dinhThuc;
        double y = (a[i] * c[j] - a[j] * c[i]) / dinhThuc;
        if (thoa(x, y)) dinh.push_back({x, y});
    }
    if (dinh.empty()) { cout << "vo_nghiem"; return 0; }
    int totNhat = 0;
    for (int i = 1; i < (int)dinh.size(); i++) {
        double hienTai = cx * dinh[i].first + cy * dinh[i].second;
        double tot = cx * dinh[totNhat].first + cy * dinh[totNhat].second;
        if (sense == 1 ? hienTai > tot : hienTai < tot) totNhat = i;
    }
    cout << fixed << setprecision(4) << dinh[totNhat].first << ' ' << dinh[totNhat].second;
    return 0;
}
