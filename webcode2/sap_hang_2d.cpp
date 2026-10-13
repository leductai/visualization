#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int n;
vector<string> ten;
vector<int> X, Y;
vector<int> hang;
vector<int> bit;

void bitThem(int i, int v) {
    for (; i < (int)bit.size(); i += i & -i) bit[i] += v;
}

int bitTong(int i) {
    int s = 0;
    for (; i > 0; i -= i & -i) s += bit[i];
    return s;
}

// Dung nua trai (x lon hon) cap nhat nua phai theo thu tu y tang dan.
void tron(int l, int mid, int r, vector<int>& theoX, const vector<int>& hangY) {
    vector<int> trai(theoX.begin() + l, theoX.begin() + mid + 1);
    vector<int> phai(theoX.begin() + mid + 1, theoX.begin() + r + 1);
    sort(trai.begin(), trai.end(), [&](int a, int b) { return Y[a] < Y[b]; });
    sort(phai.begin(), phai.end(), [&](int a, int b) { return Y[a] < Y[b]; });
    size_t p = 0;
    vector<int> daThem;
    for (int q : phai) {
        while (p < trai.size() && Y[trai[p]] < Y[q]) {
            bitThem(hangY[trai[p]], 1);
            daThem.push_back(trai[p]);
            p++;
        }
        hang[q] += bitTong(hangY[q] - 1);
    }
    for (int v : daThem) bitThem(hangY[v], -1);
}

void cdq(int l, int r, vector<int>& theoX, const vector<int>& hangY) {
    if (l >= r) return;
    if (X[theoX[l]] == X[theoX[r]]) return; // cùng hoành độ: không cặp nào đếm được
    int mid = (l + r) / 2;
    // Không cắt ngang cụm cùng x: dời biên về chỗ X tăng thật để nửa trái < nửa phải.
    int k = mid;
    if (X[theoX[k]] == X[theoX[k + 1]]) {
        int a = k;
        while (a > l && X[theoX[a - 1]] == X[theoX[k]]) a--;
        int b = k + 1;
        while (b < r && X[theoX[b + 1]] == X[theoX[k + 1]]) b++;
        k = (a > l && (b >= r || mid - (a - 1) <= b - mid)) ? a - 1 : b;
    }
    cdq(l, k, theoX, hangY);
    cdq(k + 1, r, theoX, hangY);
    tron(l, k, r, theoX, hangY);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int m;
    if (!(cin >> m)) return 0;
    n = m;
    ten.resize(n); X.resize(n); Y.resize(n);
    for (int i = 0; i < n; i++) cin >> ten[i] >> X[i] >> Y[i];
    vector<int> ys = Y;
    sort(ys.begin(), ys.end());
    ys.erase(unique(ys.begin(), ys.end()), ys.end());
    vector<int> hangY(n);
    for (int i = 0; i < n; i++) hangY[i] = int(lower_bound(ys.begin(), ys.end(), Y[i]) - ys.begin()) + 1;
    vector<int> theoX(n);
    for (int i = 0; i < n; i++) theoX[i] = i;
    sort(theoX.begin(), theoX.end(), [&](int a, int b) {
        if (X[a] != X[b]) return X[a] < X[b];
        return Y[a] < Y[b];
    });
    hang.assign(n, 0);
    bit.assign(ys.size() + 2, 0);
    cdq(0, n - 1, theoX, hangY);
    for (int i = 0; i < n; i++) cout << ten[i] << ' ' << hang[i] << '\n';
    return 0;
}
