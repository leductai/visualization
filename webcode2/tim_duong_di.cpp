#include <iostream>
#include <vector>
#include <string>
using namespace std;

int n, m;
vector<string> ten;
vector<vector<int>> ke;
vector<bool> daTham;
vector<int> duong;
string batDau, ketThuc;

int chiSo(const string& s) {
    for (int i = 0; i < n; i++) if (ten[i] == s) return i;
    return -1;
}

// In một đường đi mỗi khi chạm đích.
void inDuongDi() {
    for (int i = 0; i < (int)duong.size(); i++) {
        if (i > 0) cout << " -> ";
        cout << ten[duong[i]];
    }
    cout << '\n';
}

// Thử mọi cạnh ra tới đỉnh chưa thăm (quay lui liệt kê).
void dfs(int u) {
    if (ten[u] == ketThuc) {
        inDuongDi();
        return;
    }
    for (int v : ke[u]) {
        if (!daTham[v]) {
            daTham[v] = true;
            duong.push_back(v);
            dfs(v);
            // Hoàn tác để thử cạnh khác.
            duong.pop_back();
            daTham[v] = false;
        }
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m;
    ten.resize(n);
    for (int i = 0; i < n; i++) cin >> ten[i];
    ke.assign(n, {});
    for (int i = 0; i < m; i++) {
        string a, b;
        cin >> a >> b;
        ke[chiSo(a)].push_back(chiSo(b));
    }
    cin >> batDau >> ketThuc;
    int s = chiSo(batDau);
    daTham.assign(n, false);
    daTham[s] = true;
    duong.push_back(s);
    dfs(s);
    return 0;
}
