#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <numeric>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    if (!(cin >> n >> m)) return 0;
    vector<string> ten(n);
    for (int i = 0; i < n; i++) cin >> ten[i];
    vector<vector<int>> ke(n);
    auto chiSo = [&](const string& s) {
        for (int i = 0; i < n; i++) if (ten[i] == s) return i;
        return -1;
    };
    for (int k = 0; k < m; k++) {
        string a, b;
        cin >> a >> b;
        int u = chiSo(a), v = chiSo(b);
        ke[u].push_back(v);
        ke[v].push_back(u);
    }
    // Welsh-Powell: xet dinh bac giam dan (hoa nhap theo input), to mau nho nhat con trong.
    vector<int> thuTu(n);
    iota(thuTu.begin(), thuTu.end(), 0);
    sort(thuTu.begin(), thuTu.end(), [&](int a, int b) {
        if (ke[a].size() != ke[b].size()) return ke[a].size() > ke[b].size();
        return a < b;
    });
    vector<int> mau(n, 0);
    int soMau = 0;
    for (int v : thuTu) {
        vector<bool> cam(n + 1, false);
        for (int u : ke[v]) if (mau[u] > 0) cam[mau[u]] = true;
        int c = 1;
        while (c <= n && cam[c]) c++;
        mau[v] = c;
        if (c > soMau) soMau = c;
    }
    cout << soMau << '\n';
    for (int i = 0; i < n; i++) {
        if (i > 0) cout << ' ';
        cout << ten[i] << mau[i];
    }
    cout << '\n';
    return 0;
}
