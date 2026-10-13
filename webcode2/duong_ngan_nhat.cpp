#include <iostream>
#include <vector>
#include <string>
using namespace std;
const int VO_CUNG = 1e9;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    if (!(cin >> n >> m)) return 0;
    vector<string> ten(n);
    for (int i = 0; i < n; i++) cin >> ten[i];
    vector<vector<pair<int,int>>> ke(n);
    auto chiSo = [&](const string& s) {
        for (int i = 0; i < n; i++) if (ten[i] == s) return i;
        return -1;
    };
    for (int k = 0; k < m; k++) {
        string a, b; int w;
        cin >> a >> b >> w;
        ke[chiSo(a)].push_back({chiSo(b), w});
    }
    string batDau, ketThuc;
    cin >> batDau >> ketThuc;
    int s = chiSo(batDau), t = chiSo(ketThuc);
    vector<int> dist(n, VO_CUNG), truoc(n, -1);
    vector<bool> xong(n, false);
    dist[s] = 0;
    // Tham lam: moi vong chot dinh chua xong co dist nho nhat.
    for (int lap = 0; lap < n; lap++) {
        int u = -1;
        for (int i = 0; i < n; i++) if (!xong[i] && (u == -1 || dist[i] < dist[u])) u = i;
        if (u == -1 || dist[u] == VO_CUNG) break;
        xong[u] = true;
        for (auto [v, w] : ke[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                truoc[v] = u;
            }
        }
    }
    if (dist[t] < VO_CUNG) {
        vector<int> duong;
        for (int v = t; v != -1; v = truoc[v]) duong.push_back(v);
        for (int i = (int)duong.size() - 1; i >= 0; i--) {
            if (i < (int)duong.size() - 1) cout << " -> ";
            cout << ten[duong[i]];
        }
        cout << '\n';
    }
    for (int i = 0; i < n; i++) {
        if (i > 0) cout << ' ';
        if (dist[i] >= VO_CUNG) cout << -1;
        else cout << dist[i];
    }
    cout << '\n';
    return 0;
}
