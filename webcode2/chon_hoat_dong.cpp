#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    vector<int> s(n), f(n);
    for (int i = 0; i < n; i++) cin >> s[i] >> f[i];
    vector<int> idx(n);
    iota(idx.begin(), idx.end(), 0);
    // Tham lam: ket thuc som truoc (nua mo [s, f) nen s >= fCuoi la tuong thich).
    sort(idx.begin(), idx.end(), [&](int a, int b) {
        if (f[a] != f[b]) return f[a] < f[b];
        if (s[a] != s[b]) return s[a] < s[b];
        return a < b;
    });
    vector<int> chon;
    chon.push_back(idx[0]);
    int fCuoi = f[idx[0]];
    for (size_t k = 1; k < idx.size(); k++) {
        int i = idx[k];
        if (s[i] >= fCuoi) {
            chon.push_back(i);
            fCuoi = f[i];
        }
    }
    cout << chon.size() << '\n';
    for (size_t k = 0; k < chon.size(); k++) {
        if (k > 0) cout << ' ';
        cout << chon[k] + 1;
    }
    cout << '\n';
    return 0;
}
